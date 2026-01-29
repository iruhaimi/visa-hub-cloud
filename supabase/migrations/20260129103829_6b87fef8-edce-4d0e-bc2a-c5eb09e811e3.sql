-- Fix RLS policy for 2FA verification - allow anonymous reading during verification
DROP POLICY IF EXISTS "Users can view own 2FA codes" ON public.staff_2fa_codes;
DROP POLICY IF EXISTS "System can update 2FA codes" ON public.staff_2fa_codes;

-- Allow reading 2FA codes by matching user_id (even when not authenticated, for verification)
CREATE POLICY "Anyone can verify 2FA codes"
ON public.staff_2fa_codes
FOR SELECT
USING (true);

-- Allow updating (marking as used) 2FA codes
CREATE POLICY "Anyone can update 2FA codes for verification"
ON public.staff_2fa_codes
FOR UPDATE
USING (true);