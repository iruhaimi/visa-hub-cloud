-- Add DELETE policy for admins on staff_login_attempts table
CREATE POLICY "Admins can delete login attempts"
ON public.staff_login_attempts
FOR DELETE
USING (is_admin(auth.uid()));