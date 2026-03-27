
-- Recreate view with security_invoker=on to inherit base table RLS
DROP VIEW IF EXISTS public.application_documents_safe;

CREATE VIEW public.application_documents_safe
WITH (security_invoker = on) AS
  SELECT id,
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
