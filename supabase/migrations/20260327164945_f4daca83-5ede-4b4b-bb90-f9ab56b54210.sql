
-- Fix 1: Change refund_requests SELECT, UPDATE, DELETE policies from 'public' to 'authenticated'
DROP POLICY IF EXISTS "Users can view own refund requests" ON public.refund_requests;
CREATE POLICY "Users can view own refund requests"
ON public.refund_requests FOR SELECT TO authenticated
USING (
  email = (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())::text
  OR is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Admins can update refund requests" ON public.refund_requests;
CREATE POLICY "Admins can update refund requests"
ON public.refund_requests FOR UPDATE TO authenticated
USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete refund requests" ON public.refund_requests;
CREATE POLICY "Admins can delete refund requests"
ON public.refund_requests FOR DELETE TO authenticated
USING (is_admin(auth.uid()));

-- Fix 2: Secure application_documents_safe view using security_invoker
-- Recreate view with security_invoker = true so it inherits RLS from base table
DROP VIEW IF EXISTS public.application_documents_safe;
CREATE VIEW public.application_documents_safe
WITH (security_invoker = true)
AS SELECT 
  id,
  application_id,
  document_type,
  file_name,
  file_size,
  mime_type,
  status,
  verification_notes,
  verified_at,
  created_at,
  updated_at
FROM public.application_documents;
