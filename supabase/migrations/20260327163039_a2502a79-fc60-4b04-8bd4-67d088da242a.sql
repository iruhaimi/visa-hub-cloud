
-- Fix: Add access control to clear_failed_login_attempts
CREATE OR REPLACE FUNCTION public.clear_failed_login_attempts(target_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
    -- Only allow admins or the user themselves (matching email) to clear attempts
    IF NOT (
      is_admin(auth.uid()) 
      OR (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()) = target_email
    ) THEN
      RAISE EXCEPTION 'Access denied: insufficient permissions';
    END IF;

    DELETE FROM public.staff_login_attempts 
    WHERE email = target_email AND success = false;
END;
$$;
