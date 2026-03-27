
-- Allow super admin OR the user clearing their own email's failed attempts
CREATE OR REPLACE FUNCTION public.clear_failed_login_attempts(target_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
    -- Allow: super admin (owner) OR user clearing their own failed attempts
    IF NOT (
      has_permission(auth.uid(), 'manage_staff')
      OR (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()) = target_email
    ) THEN
      RAISE EXCEPTION 'Access denied: insufficient permissions';
    END IF;

    DELETE FROM public.staff_login_attempts 
    WHERE email = target_email AND success = false;
END;
$$;
