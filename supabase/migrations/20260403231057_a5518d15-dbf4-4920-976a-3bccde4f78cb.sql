
-- Allow assigned agents to download/view customer documents from storage
-- The agent needs to read files stored under {customer_auth_uid}/{application_id}/
CREATE POLICY "Agents can read assigned application documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] != 'work-submissions'
  AND (storage.foldername(name))[1] != 'backups'
  AND EXISTS (
    SELECT 1
    FROM applications a
    JOIN profiles p_owner ON a.user_id = p_owner.id
    WHERE p_owner.user_id::text = (storage.foldername(name))[1]
      AND is_assigned_agent(a.id, auth.uid())
  )
);
