
-- Allow owner to reset a failed payment back to draft (to retry)
CREATE POLICY "Owners can reset pending_payment to draft"
  ON public.applications FOR UPDATE
  USING (
    is_application_owner(id, auth.uid()) AND
    status = 'pending_payment'::application_status
  )
  WITH CHECK (
    is_application_owner(id, auth.uid()) AND
    status = 'draft'::application_status
  );
