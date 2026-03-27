
CREATE OR REPLACE FUNCTION public.is_profile_owner(_profile_id uuid, _auth_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = _profile_id
      AND p.user_id = _auth_user_id
  )
$$;

DROP POLICY IF EXISTS "Customers can create applications" ON public.applications;

CREATE POLICY "Customers can create applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (public.is_profile_owner(user_id, auth.uid()));
