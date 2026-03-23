-- =====================================================
-- SECURITY FIXES - Production Readiness Review
-- =====================================================

-- =====================================================
-- FIX 1: wallet_transactions - remove dangerous user self-insert policy
-- RISK: Any authenticated user could insert arbitrary wallet credits to their
--       own account, effectively minting money. All balance changes must go
--       through server-side logic (Edge Functions / triggers) using service_role.
-- =====================================================
DROP POLICY IF EXISTS "Users can insert wallet transactions" ON public.wallet_transactions;

-- Only service-role / SECURITY DEFINER functions may write wallet transactions.
-- No client-facing INSERT policy is needed; all mutations happen server-side.

-- =====================================================
-- FIX 2: notifications - restrict INSERT to service_role only
-- RISK: WITH CHECK (true) lets any authenticated user insert a notification
--       for ANY other user, enabling phishing / spam notifications.
-- =====================================================
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Only service role can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- =====================================================
-- FIX 3: application_status_history - restrict INSERT to admins/agents only
-- RISK: Customers who "can access" their own application could insert fake
--       status-change records, corrupting the audit log.
--       The existing trigger (log_application_status_change) is SECURITY DEFINER
--       and handles legitimate inserts automatically.
-- =====================================================
DROP POLICY IF EXISTS "System can insert status history" ON public.application_status_history;

-- Only admins and assigned agents may manually insert history records;
-- the trigger already handles automatic inserts via SECURITY DEFINER.
CREATE POLICY "Admins can insert status history"
  ON public.application_status_history FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Agents can insert status history for assigned applications"
  ON public.application_status_history FOR INSERT
  WITH CHECK (public.is_assigned_agent(application_id, auth.uid()));

-- =====================================================
-- FIX 4: profiles - prevent users from updating their own wallet_balance
-- RISK: The existing "Users can update own profile" policy has no column
--       restriction, so any user can UPDATE profiles SET wallet_balance = 99999
--       directly from the client.  We split the policy into a column-restricted
--       version so that wallet_balance is only writable server-side.
-- NOTE: Supabase RLS does not yet support column-level UPDATE restrictions
--       natively in policies, so we use a check trigger instead.
-- =====================================================
CREATE OR REPLACE FUNCTION public.prevent_wallet_balance_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Block if a non-service-role session is trying to change wallet_balance
  IF NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance THEN
    IF (current_setting('request.jwt.claims', true)::json->>'role') != 'service_role' THEN
      RAISE EXCEPTION 'wallet_balance can only be modified server-side';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_wallet_balance_self_update ON public.profiles;
CREATE TRIGGER trg_prevent_wallet_balance_self_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_wallet_balance_self_update();
