
-- Fix: require authentication for unlock requests to prevent email enumeration
DROP POLICY IF EXISTS "Rate limited unlock request submissions" ON public.account_unlock_requests;

CREATE POLICY "Authenticated users can submit unlock requests" ON public.account_unlock_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Must match the authenticated user's email
    email = (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())::text
    -- Still prevent duplicate pending requests
    AND NOT EXISTS (
      SELECT 1 FROM account_unlock_requests aur
      WHERE aur.email = account_unlock_requests.email
        AND aur.status = 'pending'
        AND aur.created_at > now() - interval '24 hours'
    )
  );
