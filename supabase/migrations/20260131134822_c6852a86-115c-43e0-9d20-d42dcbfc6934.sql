-- إنشاء جدول طلبات تحويل الطلبات بين الوكلاء
CREATE TABLE public.agent_transfer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    from_agent_id UUID NOT NULL REFERENCES public.profiles(id),
    to_agent_id UUID NOT NULL REFERENCES public.profiles(id),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول تأكيد إتمام العمل من الوكيل
CREATE TABLE public.agent_work_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.profiles(id),
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'returned')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.agent_transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_work_submissions ENABLE ROW LEVEL SECURITY;

-- سياسات طلبات التحويل
CREATE POLICY "Agents can create transfer requests for assigned apps"
ON public.agent_transfer_requests FOR INSERT
WITH CHECK (from_agent_id = get_profile_id(auth.uid()) AND is_assigned_agent(application_id, auth.uid()));

CREATE POLICY "Agents can view own transfer requests"
ON public.agent_transfer_requests FOR SELECT
USING (from_agent_id = get_profile_id(auth.uid()) OR to_agent_id = get_profile_id(auth.uid()));

CREATE POLICY "Admins can view all transfer requests"
ON public.agent_transfer_requests FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update transfer requests"
ON public.agent_transfer_requests FOR UPDATE
USING (is_admin(auth.uid()));

-- سياسات تأكيد إتمام العمل
CREATE POLICY "Agents can submit work for assigned apps"
ON public.agent_work_submissions FOR INSERT
WITH CHECK (agent_id = get_profile_id(auth.uid()) AND is_assigned_agent(application_id, auth.uid()));

CREATE POLICY "Agents can view own work submissions"
ON public.agent_work_submissions FOR SELECT
USING (agent_id = get_profile_id(auth.uid()));

CREATE POLICY "Admins can view all work submissions"
ON public.agent_work_submissions FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update work submissions"
ON public.agent_work_submissions FOR UPDATE
USING (is_admin(auth.uid()));

-- Trigger لتحديث updated_at
CREATE TRIGGER update_agent_transfer_requests_updated_at
BEFORE UPDATE ON public.agent_transfer_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_work_submissions_updated_at
BEFORE UPDATE ON public.agent_work_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- إشعار المشرفين عند طلب تحويل جديد
CREATE OR REPLACE FUNCTION public.notify_admin_on_transfer_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
  agent_name TEXT;
  app_country TEXT;
BEGIN
  -- Get agent name and application details
  SELECT p.full_name INTO agent_name FROM profiles p WHERE p.id = NEW.from_agent_id;
  SELECT c.name INTO app_country
  FROM applications a
  JOIN visa_types vt ON a.visa_type_id = vt.id
  JOIN countries c ON vt.country_id = c.id
  WHERE a.id = NEW.application_id;

  -- Notify all admins
  FOR admin_record IN 
    SELECT p.id as profile_id
    FROM user_roles ur
    JOIN profiles p ON ur.user_id = p.user_id
    WHERE ur.role = 'admin'
  LOOP
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      admin_record.profile_id,
      '🔄 طلب تحويل طلب',
      'يطلب ' || COALESCE(agent_name, 'وكيل') || ' تحويل طلب ' || COALESCE(app_country, '') || ' لوكيل آخر',
      'transfer_request',
      '/admin/applications/' || NEW.application_id::TEXT
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_admin_on_transfer_request_trigger
AFTER INSERT ON public.agent_transfer_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_on_transfer_request();

-- إشعار المشرفين عند تقديم عمل للمراجعة
CREATE OR REPLACE FUNCTION public.notify_admin_on_work_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
  agent_name TEXT;
  app_country TEXT;
BEGIN
  -- Get agent name and application details
  SELECT p.full_name INTO agent_name FROM profiles p WHERE p.id = NEW.agent_id;
  SELECT c.name INTO app_country
  FROM applications a
  JOIN visa_types vt ON a.visa_type_id = vt.id
  JOIN countries c ON vt.country_id = c.id
  WHERE a.id = NEW.application_id;

  -- Notify all admins
  FOR admin_record IN 
    SELECT p.id as profile_id
    FROM user_roles ur
    JOIN profiles p ON ur.user_id = p.user_id
    WHERE ur.role = 'admin'
  LOOP
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      admin_record.profile_id,
      '📋 تأكيد إتمام عمل',
      'قدم ' || COALESCE(agent_name, 'وكيل') || ' ملف إتمام العمل لطلب ' || COALESCE(app_country, '') || ' للمراجعة',
      'work_submission',
      '/admin/applications/' || NEW.application_id::TEXT
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_admin_on_work_submission_trigger
AFTER INSERT ON public.agent_work_submissions
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_on_work_submission();