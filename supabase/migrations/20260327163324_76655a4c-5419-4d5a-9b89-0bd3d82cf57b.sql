
-- Restrict clear_failed_login_attempts to super admin (manage_staff) only
CREATE OR REPLACE FUNCTION public.clear_failed_login_attempts(target_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
    -- Only super admin (owner) can clear failed login attempts
    IF NOT has_permission(auth.uid(), 'manage_staff') THEN
      RAISE EXCEPTION 'Access denied: only site owner can clear login attempts';
    END IF;

    DELETE FROM public.staff_login_attempts 
    WHERE email = target_email AND success = false;
END;
$$;
