
-- 1. Fix application_status_history INSERT policy: restrict to admins and agents only
DROP POLICY IF EXISTS "System can insert status history" ON public.application_status_history;
CREATE POLICY "Only staff can insert status history"
  ON public.application_status_history FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()) OR is_agent(auth.uid()));

-- 2. Add wallet_balance protection trigger
CREATE OR REPLACE FUNCTION public.protect_wallet_balance()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  IF OLD.wallet_balance IS DISTINCT FROM NEW.wallet_balance THEN
    IF current_setting('role') != 'service_role' THEN
      RAISE EXCEPTION 'wallet_balance can only be modified by service_role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_wallet_balance_trigger ON public.profiles;
CREATE TRIGGER protect_wallet_balance_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_wallet_balance();
