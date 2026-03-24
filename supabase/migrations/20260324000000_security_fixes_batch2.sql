-- =====================================================
-- SECURITY FIXES BATCH 2 - Critical & High Priority
-- =====================================================

-- =====================================================
-- CRIT-2: pending_sensitive_operations - prevent self-approval via RLS
-- RISK: The UPDATE policy allows the requester to approve their own
--       operation by updating status to 'approved'. The self-approval
--       check in client code (useSensitiveOperations.ts) can be bypassed
--       by a direct API call.
-- FIX:  Add requested_by != auth.uid(), status = 'pending', and
--       expires_at > now() guards directly in the RLS policy.
-- =====================================================
DROP POLICY IF EXISTS "Super admins can update pending operations" ON public.pending_sensitive_operations;

CREATE POLICY "Super admins can update pending operations"
ON public.pending_sensitive_operations FOR UPDATE
USING (
  has_permission(auth.uid(), 'manage_staff'::staff_permission)
  AND requested_by != auth.uid()
  AND status = 'pending'
  AND expires_at > now()
)
WITH CHECK (
  has_permission(auth.uid(), 'manage_staff'::staff_permission)
);

-- =====================================================
-- CRIT-3 + CRIT-4: verify_staff_2fa - SECURITY DEFINER function
-- RISK-CRIT-3: After signOut() the user's auth.uid() is NULL so any
--              direct SELECT on staff_2fa_codes (protected by RLS)
--              returns nothing, breaking the verification flow.
-- RISK-CRIT-4: 2FA codes are stored in plaintext; a DB dump or
--              service-role leakage exposes valid codes.
-- FIX:  SECURITY DEFINER function runs with elevated privileges
--       (independent of caller auth state) and compares SHA-256
--       hashes so plaintext codes are never persisted.
-- =====================================================
CREATE OR REPLACE FUNCTION public.verify_staff_2fa(p_user_id uuid, p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_id uuid;
  p_code_hash text;
BEGIN
  -- Hash the supplied plaintext code before comparing to stored hash
  SELECT encode(sha256(p_code::bytea), 'hex') INTO p_code_hash;

  UPDATE public.staff_2fa_codes
  SET used = true
  WHERE user_id = p_user_id
    AND code = p_code_hash
    AND used = false
    AND expires_at > now()
  RETURNING id INTO found_id;

  RETURN found_id IS NOT NULL;
END;
$$;

-- Grant execution to both roles so it works pre- and post-signout
GRANT EXECUTE ON FUNCTION public.verify_staff_2fa(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_staff_2fa(uuid, text) TO authenticated;

-- =====================================================
-- HIGH-1: staff_login_attempts - close open INSERT policy
-- RISK: WITH CHECK (true) lets any unauthenticated user flood the
--       login_attempts table, poisoning lockout logic or causing
--       denial-of-service via table bloat.
-- FIX:  Drop the open policy; introduce a SECURITY DEFINER RPC
--       (record_login_attempt) callable by anon/authenticated roles
--       so the client still logs attempts without direct table access.
-- =====================================================
DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.staff_login_attempts;

CREATE POLICY "Only service role can insert login attempts"
ON public.staff_login_attempts FOR INSERT TO public
WITH CHECK (
  ((current_setting('request.jwt.claims'::text, true))::json ->> 'role') = 'service_role'
);

CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email text,
  p_success boolean,
  p_failure_reason text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.staff_login_attempts (email, success, failure_reason, user_agent)
  VALUES (p_email, p_success, p_failure_reason, p_user_agent);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_login_attempt(text, boolean, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(text, boolean, text, text) TO authenticated;

-- =====================================================
-- HIGH-5: applications - block agents from setting approved/rejected
-- RISK: An agent with UPDATE access can set status = 'approved' or
--       'rejected' directly, bypassing the admin-only approval flow.
-- FIX:  BEFORE UPDATE trigger that raises an exception when a pure
--       agent (non-admin) attempts to set a terminal status.
-- =====================================================
CREATE OR REPLACE FUNCTION public.validate_application_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- No-op if status hasn't changed
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Block agents (non-admins) from setting terminal statuses
  IF public.is_agent(auth.uid()) AND NOT public.is_admin(auth.uid()) THEN
    IF NEW.status IN ('approved', 'rejected') THEN
      RAISE EXCEPTION 'Agents cannot set approved or rejected status';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_status_transition ON public.applications;
CREATE TRIGGER validate_status_transition
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.validate_application_status_transition();

-- =====================================================
-- HIGH-6: security_audit_log - restrict INSERT to admins + service_role
-- RISK: WITH CHECK (true) allows any authenticated user to write
--       arbitrary records into the audit log, enabling log injection
--       and evidence tampering.
-- FIX:  Only admins and service_role may insert audit log entries;
--       client-side code should call a SECURITY DEFINER helper or
--       perform inserts via Edge Functions using service_role.
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can insert security logs" ON public.security_audit_log;

CREATE POLICY "Only admins and service role can insert security logs"
ON public.security_audit_log FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin(auth.uid())
  OR ((current_setting('request.jwt.claims'::text, true))::json ->> 'role') = 'service_role'
);
