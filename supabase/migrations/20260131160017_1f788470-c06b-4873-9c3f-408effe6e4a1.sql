-- Create enum for sensitive operation types
CREATE TYPE public.sensitive_operation_type AS ENUM (
  'delete_staff',
  'remove_admin_role',
  'remove_manage_staff_permission'
);

-- Create enum for approval status
CREATE TYPE public.approval_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'expired'
);

-- Create table for pending sensitive operations
CREATE TABLE public.pending_sensitive_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_type sensitive_operation_type NOT NULL,
  target_user_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  request_reason TEXT,
  operation_data JSONB DEFAULT '{}'::jsonb,
  status approval_status NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for system backups metadata
CREATE TABLE public.system_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_type TEXT NOT NULL DEFAULT 'manual',
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  tables_included TEXT[] NOT NULL,
  records_count JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_sensitive_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pending_sensitive_operations
-- Only super admins (with manage_staff) can view
CREATE POLICY "Super admins can view pending operations"
ON public.pending_sensitive_operations
FOR SELECT
USING (has_permission(auth.uid(), 'manage_staff'));

-- Only super admins can insert
CREATE POLICY "Super admins can create pending operations"
ON public.pending_sensitive_operations
FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'manage_staff'));

-- Only super admins can update (approve/reject)
CREATE POLICY "Super admins can update pending operations"
ON public.pending_sensitive_operations
FOR UPDATE
USING (has_permission(auth.uid(), 'manage_staff'));

-- RLS Policies for system_backups
CREATE POLICY "Super admins can view backups"
ON public.system_backups
FOR SELECT
USING (has_permission(auth.uid(), 'manage_staff'));

CREATE POLICY "Super admins can create backups"
ON public.system_backups
FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'manage_staff'));

CREATE POLICY "Super admins can delete backups"
ON public.system_backups
FOR DELETE
USING (has_permission(auth.uid(), 'manage_staff'));

-- Create trigger for updated_at
CREATE TRIGGER update_pending_operations_updated_at
BEFORE UPDATE ON public.pending_sensitive_operations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_pending_ops_status ON public.pending_sensitive_operations(status);
CREATE INDEX idx_pending_ops_target_user ON public.pending_sensitive_operations(target_user_id);
CREATE INDEX idx_system_backups_created_at ON public.system_backups(created_at DESC);