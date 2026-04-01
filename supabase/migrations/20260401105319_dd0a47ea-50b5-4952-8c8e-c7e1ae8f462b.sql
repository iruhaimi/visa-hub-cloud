DROP POLICY IF EXISTS "Users can move own applications to pending payment" ON public.applications;

CREATE POLICY "Users can move own applications to pending payment"
ON public.applications
FOR UPDATE
TO authenticated
USING (
  public.is_application_owner(id, auth.uid())
  AND status IN ('draft'::public.application_status, 'pending_payment'::public.application_status)
)
WITH CHECK (
  public.is_application_owner(id, auth.uid())
  AND status = 'pending_payment'::public.application_status
);

DROP POLICY IF EXISTS "Users can submit own applications via WhatsApp" ON public.applications;

CREATE POLICY "Users can submit own applications via WhatsApp"
ON public.applications
FOR UPDATE
TO authenticated
USING (
  public.is_application_owner(id, auth.uid())
  AND status IN ('draft'::public.application_status, 'pending_payment'::public.application_status)
)
WITH CHECK (
  public.is_application_owner(id, auth.uid())
  AND status = 'whatsapp_pending'::public.application_status
);