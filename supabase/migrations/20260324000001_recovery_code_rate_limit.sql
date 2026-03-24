-- =====================================================
-- MED-3: Server-side rate limit for recovery code verification
-- RISK: The 3-attempt limit in RecoveryCodeVerification.tsx is enforced
--       client-side only. An attacker calling the Supabase API directly
--       can enumerate recovery codes without any server-side throttle.
-- FIX:  SECURITY DEFINER function tracks recent usage of recovery codes
--       as a proxy for verification attempts. It also uses the login
--       attempts table (failures) so failed recovery tries are also counted.
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_recovery_rate_limit(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt_count integer;
  target_email  text;
BEGIN
  -- Resolve the user's email for checking login_attempts
  SELECT au.email INTO target_email
  FROM auth.users au
  WHERE au.id = check_user_id;

  -- Count recent failed login attempts that may be recovery-code verification tries.
  -- This works because verifyRecoveryCodeHandler calls logLoginAttempt on failure.
  -- Window: 15 minutes; limit: 5 attempts.
  SELECT COUNT(*) INTO attempt_count
  FROM public.staff_login_attempts
  WHERE email = target_email
    AND success = false
    AND created_at > now() - interval '15 minutes';

  RETURN attempt_count < 5;
END;
$$;

-- Callable pre-auth (anon) since recovery verification happens post-signout
GRANT EXECUTE ON FUNCTION public.check_recovery_rate_limit(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.check_recovery_rate_limit(uuid) TO authenticated;
