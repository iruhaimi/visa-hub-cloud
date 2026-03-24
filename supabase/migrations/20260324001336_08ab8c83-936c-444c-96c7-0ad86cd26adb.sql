
-- ============================================================
-- CRIT-2/HIGH-2: Add self-approval prevention + expiry check on pending_sensitive_operations
-- ============================================================

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Super admins can update pending operations" ON public.pending_sensitive_operations;

-- Create new UPDATE policy with self-approval prevention and expiry check
CREATE POLICY "Super admins can update pending operations"
ON public.pending_sensitive_operations FOR UPDATE
TO public
USING (
  has_permission(auth.uid(), 'manage_staff'::staff_permission)
  AND requested_by != auth.uid()
  AND status = 'pending'
  AND expires_at > now()
)
WITH CHECK (
  has_permission(auth.uid(), 'manage_staff'::staff_permission)
);

-- ============================================================
-- CRIT-3: Create SECURITY DEFINER function for 2FA verification (works post-signout)
-- ============================================================

CREATE OR REPLACE FUNCTION public.verify_staff_2fa(p_user_id uuid, p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_id uuid;
BEGIN
  UPDATE staff_2fa_codes
  SET used = true
  WHERE user_id = p_user_id
    AND code = p_code
    AND used = false
    AND expires_at > now()
  RETURNING id INTO found_id;
  
  RETURN found_id IS NOT NULL;
END;
$$;

-- Grant execute to anon and authenticated (needed during pre-auth flow)
GRANT EXECUTE ON FUNCTION public.verify_staff_2fa(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_staff_2fa(uuid, text) TO authenticated;

-- ============================================================
-- HIGH-1: Replace open INSERT on staff_login_attempts with SECURITY DEFINER function
-- ============================================================

-- Drop the dangerous open INSERT policy
DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.staff_login_attempts;

-- Create restricted INSERT policy (service_role only via function)
CREATE POLICY "Only service role can insert login attempts"
ON public.staff_login_attempts FOR INSERT
TO public
WITH CHECK (
  ((current_setting('request.jwt.claims'::text, true))::json ->> 'role') = 'service_role'
);

-- Create SECURITY DEFINER function for recording login attempts
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

-- Grant execute to anon (needed during pre-auth login flow)
GRANT EXECUTE ON FUNCTION public.record_login_attempt(text, boolean, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(text, boolean, text, text) TO authenticated;

-- ============================================================
-- HIGH-5: Add status transition validation trigger for agents
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_application_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only validate if status is actually changing
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Agents cannot set terminal statuses (approved/rejected)
  IF is_agent(auth.uid()) AND NOT is_admin(auth.uid()) THEN
    IF NEW.status IN ('approved', 'rejected') THEN
      RAISE EXCEPTION 'Agents cannot set approved or rejected status';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_status_transition
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_application_status_transition();

-- ============================================================
-- HIGH-6: Restrict security_audit_log INSERT to service_role + admins only
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can insert security logs" ON public.security_audit_log;

CREATE POLICY "Only admins and service role can insert security logs"
ON public.security_audit_log FOR INSERT
TO authenticated
WITH CHECK (
  is_admin(auth.uid()) OR
  ((current_setting('request.jwt.claims'::text, true))::json ->> 'role') = 'service_role'
);
