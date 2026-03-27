
-- 1. Remove overly permissive anonymous policies on staff_2fa_codes
DROP POLICY IF EXISTS "Allow anonymous to verify 2FA codes" ON public.staff_2fa_codes;
DROP POLICY IF EXISTS "Allow anonymous to mark 2FA codes as used" ON public.staff_2fa_codes;

-- 2. Fix staff_recovery_codes: remove anonymous INSERT access
DROP POLICY IF EXISTS "Service role can insert recovery codes" ON public.staff_recovery_codes;
CREATE POLICY "Service role can insert recovery codes" ON public.staff_recovery_codes
  FOR INSERT TO public
  WITH CHECK (
    ((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text
  );

-- 3. Fix staff_recovery_codes: remove anonymous UPDATE access
DROP POLICY IF EXISTS "Users can verify their own recovery codes" ON public.staff_recovery_codes;
CREATE POLICY "Users can verify their own recovery codes" ON public.staff_recovery_codes
  FOR UPDATE TO public
  USING (user_id = auth.uid());
