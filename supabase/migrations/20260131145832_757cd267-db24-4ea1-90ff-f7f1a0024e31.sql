-- Create enum for granular permissions
CREATE TYPE public.staff_permission AS ENUM (
  'manage_applications',     -- إدارة الطلبات
  'manage_users',            -- إدارة المستخدمين
  'manage_staff',            -- إدارة الموظفين (إضافة/حذف/تعديل صلاحيات)
  'manage_settings',         -- إدارة إعدادات النظام
  'manage_offers',           -- إدارة العروض الخاصة
  'manage_countries',        -- إدارة الدول وأنواع التأشيرات
  'manage_hero',             -- إدارة واجهة الهيرو
  'view_reports',            -- عرض التقارير والإحصائيات
  'process_refunds',         -- معالجة طلبات الاسترداد
  'manage_unlock_requests'   -- معالجة طلبات فك القفل
);

-- Create staff_permissions table for granular permission control
CREATE TABLE public.staff_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission public.staff_permission NOT NULL,
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission)
);

-- Enable RLS
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission staff_permission)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Super admins (with manage_staff permission) have all permissions
    EXISTS (
      SELECT 1 FROM public.staff_permissions
      WHERE user_id = _user_id AND permission = 'manage_staff'
    )
    OR
    -- Check specific permission
    EXISTS (
      SELECT 1 FROM public.staff_permissions
      WHERE user_id = _user_id AND permission = _permission
    )
$$;

-- Create function to check if user is super admin (has manage_staff)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_permissions
    WHERE user_id = _user_id AND permission = 'manage_staff'
  )
$$;

-- RLS Policies for staff_permissions
CREATE POLICY "Admins with manage_staff can view all permissions"
ON public.staff_permissions FOR SELECT TO authenticated
USING (
  is_admin(auth.uid()) AND has_permission(auth.uid(), 'manage_staff')
);

CREATE POLICY "Users can view own permissions"
ON public.staff_permissions FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins with manage_staff can insert permissions"
ON public.staff_permissions FOR INSERT TO authenticated
WITH CHECK (
  is_admin(auth.uid()) AND has_permission(auth.uid(), 'manage_staff')
);

CREATE POLICY "Admins with manage_staff can update permissions"
ON public.staff_permissions FOR UPDATE TO authenticated
USING (
  is_admin(auth.uid()) AND has_permission(auth.uid(), 'manage_staff')
);

CREATE POLICY "Admins with manage_staff can delete permissions"
ON public.staff_permissions FOR DELETE TO authenticated
USING (
  is_admin(auth.uid()) AND has_permission(auth.uid(), 'manage_staff')
);

-- Add trigger for updated_at
CREATE TRIGGER update_staff_permissions_updated_at
  BEFORE UPDATE ON public.staff_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();