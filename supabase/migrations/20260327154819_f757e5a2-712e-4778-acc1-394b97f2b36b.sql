
-- Drop the old INSERT policy
DROP POLICY IF EXISTS "Customers can create applications" ON public.applications;

-- Create a simpler INSERT policy that checks directly
CREATE POLICY "Customers can create applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = applications.user_id
    AND profiles.user_id = auth.uid()
  )
);
