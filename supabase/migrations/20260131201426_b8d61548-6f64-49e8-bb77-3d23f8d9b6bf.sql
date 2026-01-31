-- Add RLS policy to allow anonymous users to SELECT from staff_2fa_codes for verification
-- This is needed because users are not authenticated during the 2FA verification step

CREATE POLICY "Allow anonymous to verify 2FA codes"
ON public.staff_2fa_codes
FOR SELECT
USING (true);

-- Also add policy to allow anonymous users to UPDATE (mark as used)
CREATE POLICY "Allow anonymous to mark 2FA codes as used"
ON public.staff_2fa_codes
FOR UPDATE
USING (true)
WITH CHECK (true);