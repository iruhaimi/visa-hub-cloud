
-- Allow application owners to update their own applications from pending_payment to submitted
CREATE POLICY "Users can update own pending_payment applications"
  ON public.applications FOR UPDATE
  USING (
    is_application_owner(id, auth.uid()) AND
    status = 'pending_payment'::application_status
  )
  WITH CHECK (
    is_application_owner(id, auth.uid()) AND
    status = 'submitted'::application_status
  );
