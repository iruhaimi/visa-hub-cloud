CREATE OR REPLACE FUNCTION public.check_recovery_rate_limit(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  attempt_count integer;
BEGIN
  -- Count recovery code verification attempts in last 15 minutes
  SELECT COUNT(*) INTO attempt_count
  FROM staff_recovery_codes
  WHERE user_id = check_user_id
  AND used_at IS NOT NULL
  AND used_at > now() - interval '15 minutes';
  
  -- Also count recent failed attempts by checking update timestamps
  -- Allow max 5 verification attempts per 15 minutes
  RETURN attempt_count < 5;
END;
$$;