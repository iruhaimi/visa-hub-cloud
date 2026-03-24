
-- CRIT-4: Update verify_staff_2fa to compare SHA-256 hashes instead of plaintext
CREATE OR REPLACE FUNCTION public.verify_staff_2fa(p_user_id uuid, p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_id uuid;
  code_hash text;
BEGIN
  -- Hash the submitted code using SHA-256 (same as Edge Function)
  code_hash := encode(sha256(convert_to(p_code, 'UTF8')), 'hex');
  
  UPDATE staff_2fa_codes
  SET used = true
  WHERE user_id = p_user_id
    AND code = code_hash
    AND used = false
    AND expires_at > now()
  RETURNING id INTO found_id;
  
  RETURN found_id IS NOT NULL;
END;
$$;
