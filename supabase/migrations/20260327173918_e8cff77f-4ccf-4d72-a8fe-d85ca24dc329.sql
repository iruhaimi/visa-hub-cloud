
-- Remove direct SELECT access to staff_2fa_codes
-- Codes are SHA-256 hashed before storage, verification is done
-- exclusively via the verify_staff_2fa RPC (SECURITY DEFINER).
-- Users never need to read rows directly from this table.
DROP POLICY IF EXISTS "Users can only view own pending 2FA codes" ON public.staff_2fa_codes;
