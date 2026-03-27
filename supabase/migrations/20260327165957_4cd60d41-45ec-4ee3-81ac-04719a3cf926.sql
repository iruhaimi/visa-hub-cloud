
-- Create a trigger to auto-assign 'customer' role on profile creation
CREATE OR REPLACE FUNCTION public.auto_assign_customer_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Attach trigger to profiles table (fires after new profile is created)
DROP TRIGGER IF EXISTS assign_customer_role_on_profile ON public.profiles;
CREATE TRIGGER assign_customer_role_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_customer_role();

-- Remove the client-side self-insert policy (no longer needed)
DROP POLICY IF EXISTS "New users can create customer role for self" ON public.user_roles;
