
-- Fix refund_requests INSERT: require authentication to prevent spam
DROP POLICY IF EXISTS "Anyone can submit refund requests" ON public.refund_requests;

CREATE POLICY "Authenticated users can submit refund requests" ON public.refund_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
