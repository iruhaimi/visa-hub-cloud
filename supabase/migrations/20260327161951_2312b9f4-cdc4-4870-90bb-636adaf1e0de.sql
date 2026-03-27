
-- Fix notifications INSERT policy to prevent customers from sending notifications to others
DROP POLICY IF EXISTS "Authenticated users can create notifications for others" ON public.notifications;

CREATE POLICY "Staff can create notifications for others" ON public.notifications
  FOR INSERT TO public
  WITH CHECK (
    (auth.uid() IS NOT NULL) AND (
      is_admin(auth.uid()) OR is_agent(auth.uid())
    )
  );
