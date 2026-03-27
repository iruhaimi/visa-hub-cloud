
-- Fix 1: Recreate application_documents_safe view with security_invoker
-- This ensures the view checks RLS policies of the base table (application_documents)
DROP VIEW IF EXISTS public.application_documents_safe;
CREATE VIEW public.application_documents_safe
WITH (security_invoker = on)
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

-- Fix 2: Restrict staff_recovery_codes UPDATE policy
-- Remove old permissive policy and create restricted one
DROP POLICY IF EXISTS "Users can verify their own recovery codes" ON public.staff_recovery_codes;
CREATE POLICY "Users can verify their own recovery codes"
ON public.staff_recovery_codes FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND used = true AND used_at IS NOT NULL);

-- Also restrict SELECT and INSERT to authenticated
DROP POLICY IF EXISTS "Users can view own recovery codes status" ON public.staff_recovery_codes;
CREATE POLICY "Users can view own recovery codes status"
ON public.staff_recovery_codes FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can insert recovery codes" ON public.staff_recovery_codes;
CREATE POLICY "Service role can insert recovery codes"
ON public.staff_recovery_codes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
