-- Add storage policies for agents to upload work submission files

-- Policy for agents to upload files to work-submissions folder
CREATE POLICY "Agents can upload work submission files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'work-submissions' AND
  public.is_agent(auth.uid())
);

-- Policy for agents to read their own work submission files
CREATE POLICY "Agents can read work submission files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'work-submissions' AND
  (public.is_agent(auth.uid()) OR public.is_admin(auth.uid()))
);

-- Policy for admins to read all work submission files
CREATE POLICY "Admins can read all documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  public.is_admin(auth.uid())
);

-- Policy for agents to delete their own work submission files
CREATE POLICY "Agents can delete their work submission files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'work-submissions' AND
  public.is_agent(auth.uid())
);