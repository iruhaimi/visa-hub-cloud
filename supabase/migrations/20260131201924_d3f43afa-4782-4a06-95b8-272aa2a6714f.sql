-- Add storage policy for super admins to upload backups
CREATE POLICY "Super admins can upload backups"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = 'backups'
  AND has_permission(auth.uid(), 'manage_staff')
);

-- Add policy to read backups
CREATE POLICY "Super admins can read backups"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = 'backups'
  AND has_permission(auth.uid(), 'manage_staff')
);

-- Add policy to delete backups
CREATE POLICY "Super admins can delete backups"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = 'backups'
  AND has_permission(auth.uid(), 'manage_staff')
);