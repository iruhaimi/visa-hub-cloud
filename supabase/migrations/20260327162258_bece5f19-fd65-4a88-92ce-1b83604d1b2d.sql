
-- Fix: ensure submitted email matches the authenticated user's email
DROP POLICY IF EXISTS "Authenticated users can submit refund requests" ON public.refund_requests;

CREATE POLICY "Authenticated users can submit own refund requests" ON public.refund_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    email = (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())::text
  );
