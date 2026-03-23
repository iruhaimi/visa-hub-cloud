
-- Drop the overly permissive INSERT policy on security_audit_log
DROP POLICY IF EXISTS "System can insert security logs" ON public.security_audit_log;

-- Create a new policy that only allows authenticated users to insert
CREATE POLICY "Authenticated users can insert security logs"
ON public.security_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);
