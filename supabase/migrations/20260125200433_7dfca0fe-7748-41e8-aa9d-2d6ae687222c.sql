-- Fix the notifications INSERT policy that uses (true)
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a more secure policy for notifications insert
CREATE POLICY "Authenticated users can create notifications for others"
  ON public.notifications FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      user_id = public.get_profile_id(auth.uid()) OR
      public.is_admin(auth.uid()) OR
      public.is_agent(auth.uid())
    )
  );

-- Fix function search paths for functions that don't have it set
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;