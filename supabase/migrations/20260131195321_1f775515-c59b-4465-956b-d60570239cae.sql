
-- =============================================
-- إنشاء جدول تدقيق الوصول للمستندات
-- =============================================

CREATE TABLE public.document_access_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.application_documents(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  accessed_by UUID NOT NULL,
  accessed_by_name TEXT,
  access_type TEXT NOT NULL DEFAULT 'view', -- view, download, update
  document_type TEXT, -- passport, id, etc.
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS
ALTER TABLE public.document_access_log ENABLE ROW LEVEL SECURITY;

-- المشرفون والمالكون فقط يمكنهم عرض سجلات التدقيق
CREATE POLICY "Admins can view document access logs"
ON public.document_access_log
FOR SELECT
USING (is_admin(auth.uid()));

-- النظام يمكنه إضافة سجلات (عبر الوكلاء والمشرفين)
CREATE POLICY "Staff can insert access logs"
ON public.document_access_log
FOR INSERT
WITH CHECK (
  is_admin(auth.uid()) OR is_agent(auth.uid())
);

-- لا يمكن تعديل أو حذف السجلات (غير قابلة للتغيير)
-- No UPDATE or DELETE policies = immutable audit log

-- إنشاء فهرس للبحث السريع
CREATE INDEX idx_document_access_log_document ON public.document_access_log(document_id);
CREATE INDEX idx_document_access_log_application ON public.document_access_log(application_id);
CREATE INDEX idx_document_access_log_accessed_by ON public.document_access_log(accessed_by);
CREATE INDEX idx_document_access_log_created_at ON public.document_access_log(created_at DESC);

-- إضافة تعليق توثيقي
COMMENT ON TABLE public.document_access_log IS 'سجل تدقيق غير قابل للتعديل لتتبع وصول الموظفين للمستندات الحساسة';

-- =============================================
-- إنشاء دالة لإشعار المشرفين عند الوصول المتكرر
-- =============================================

CREATE OR REPLACE FUNCTION public.check_excessive_document_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  access_count INTEGER;
  admin_record RECORD;
  accessor_name TEXT;
BEGIN
  -- حساب عدد مرات الوصول لهذا المستند في آخر ساعة
  SELECT COUNT(*) INTO access_count
  FROM public.document_access_log
  WHERE document_id = NEW.document_id
    AND accessed_by = NEW.accessed_by
    AND created_at > now() - interval '1 hour';

  -- إذا تجاوز 5 مرات في الساعة، أرسل تنبيه للمشرفين
  IF access_count > 5 THEN
    SELECT full_name INTO accessor_name FROM profiles WHERE user_id = NEW.accessed_by;
    
    FOR admin_record IN 
      SELECT p.id as profile_id
      FROM user_roles ur
      JOIN profiles p ON ur.user_id = p.user_id
      WHERE ur.role = 'admin'
    LOOP
      INSERT INTO notifications (user_id, title, message, type, action_url)
      VALUES (
        admin_record.profile_id,
        '⚠️ تنبيه: وصول متكرر للمستندات',
        'قام ' || COALESCE(accessor_name, 'موظف') || ' بالوصول لنفس المستند ' || access_count || ' مرات في الساعة الأخيرة',
        'security_alert',
        '/admin/applications/' || NEW.application_id::TEXT
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- ربط الدالة بالجدول
CREATE TRIGGER on_document_access_check
  AFTER INSERT ON public.document_access_log
  FOR EACH ROW
  EXECUTE FUNCTION public.check_excessive_document_access();
