-- Remove the permissive INSERT policy that allows any authenticated user to insert wallet transactions
DROP POLICY IF EXISTS "Users can insert wallet transactions" ON public.wallet_transactions;

-- Create a restrictive policy: only admins can insert wallet transactions (server-side/triggers/edge functions)
CREATE POLICY "Only admins can insert wallet transactions"
ON public.wallet_transactions
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));