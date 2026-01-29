-- Create activity log table for tracking role changes
CREATE TABLE public.role_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_user_id UUID NOT NULL,
  performed_by UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('add_role', 'remove_role')),
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.role_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view the activity log
CREATE POLICY "Admins can view role activity log"
  ON public.role_activity_log
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Only admins can insert into activity log
CREATE POLICY "Admins can insert role activity log"
  ON public.role_activity_log
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_role_activity_log_created_at ON public.role_activity_log(created_at DESC);
CREATE INDEX idx_role_activity_log_target_user ON public.role_activity_log(target_user_id);