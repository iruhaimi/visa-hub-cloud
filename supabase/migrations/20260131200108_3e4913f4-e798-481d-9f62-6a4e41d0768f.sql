-- =====================================================
-- إصلاح الثغرات الأمنية الحرجة في قاعدة البيانات
-- =====================================================

-- 1. إصلاح ثغرة staff_2fa_codes - منع الوصول غير المصرح
-- =====================================================
DROP POLICY IF EXISTS "Anyone can verify 2FA codes" ON public.staff_2fa_codes;
DROP POLICY IF EXISTS "Anyone can update 2FA codes for verification" ON public.staff_2fa_codes;
DROP POLICY IF EXISTS "Users can verify their own 2FA codes" ON public.staff_2fa_codes;
DROP POLICY IF EXISTS "Users can view codes for verification" ON public.staff_2fa_codes;
DROP POLICY IF EXISTS "Service role can insert 2FA codes" ON public.staff_2fa_codes;

-- سياسة إدخال الرموز - فقط من Edge Function
CREATE POLICY "Only service role can insert 2FA codes"
ON public.staff_2fa_codes FOR INSERT
WITH CHECK (
  (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
);

-- سياسة قراءة الرموز - فقط للمستخدم المعني أو عبر معرف المستخدم في الجلسة
CREATE POLICY "Users can only view own pending 2FA codes"
ON public.staff_2fa_codes FOR SELECT
USING (
  user_id = auth.uid() 
  AND used = false 
  AND expires_at > now()
);

-- سياسة تحديث الرموز - فقط للمستخدم المعني
CREATE POLICY "Users can only mark own codes as used"
ON public.staff_2fa_codes FOR UPDATE
USING (user_id = auth.uid() AND used = false AND expires_at > now())
WITH CHECK (user_id = auth.uid() AND used = true);

-- 2. تشديد حماية جدول profiles - إخفاء البيانات الحساسة
-- =====================================================
-- إنشاء view آمن للوكلاء بدون البيانات الحساسة
CREATE OR REPLACE VIEW public.profiles_agent_view
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  full_name,
  phone,
  city,
  country,
  created_at
  -- حذف: passport_number, passport_expiry, date_of_birth, nationality, address, wallet_balance
FROM public.profiles;

-- 3. إنشاء دالة آمنة للحصول على رابط مستند موقّع
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_secure_document_info(doc_id uuid)
RETURNS TABLE (
  id uuid,
  document_type text,
  file_name text,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app_id uuid;
  user_profile_id uuid;
BEGIN
  -- الحصول على application_id
  SELECT application_id INTO app_id FROM application_documents WHERE application_documents.id = doc_id;
  
  -- التحقق من الصلاحيات
  IF NOT can_access_application(app_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- إرجاع البيانات بدون file_path
  RETURN QUERY
  SELECT 
    ad.id,
    ad.document_type,
    ad.file_name,
    ad.status::text,
    ad.created_at
  FROM application_documents ad
  WHERE ad.id = doc_id;
END;
$$;

-- 4. إصلاح جدول account_unlock_requests
-- =====================================================
DROP POLICY IF EXISTS "Anyone can submit unlock requests" ON public.account_unlock_requests;
DROP POLICY IF EXISTS "Users can view own unlock requests" ON public.account_unlock_requests;

-- سياسة إدخال طلبات فك القفل - يتطلب محاولة تسجيل دخول فاشلة مسبقة
CREATE POLICY "Rate limited unlock request submissions"
ON public.account_unlock_requests FOR INSERT
WITH CHECK (
  -- التحقق من أن البريد موجود في محاولات تسجيل الدخول الفاشلة
  EXISTS (
    SELECT 1 FROM staff_login_attempts sla
    WHERE sla.email = account_unlock_requests.email
    AND sla.success = false
    AND sla.created_at > now() - interval '24 hours'
  )
  -- منع تكرار الطلبات
  AND NOT EXISTS (
    SELECT 1 FROM account_unlock_requests aur
    WHERE aur.email = account_unlock_requests.email
    AND aur.status = 'pending'
    AND aur.created_at > now() - interval '24 hours'
  )
);

-- سياسة عرض الطلبات - فقط للمستخدم المسجل دخوله
CREATE POLICY "Authenticated users can view own unlock requests"
ON public.account_unlock_requests FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- سياسة للمشرفين
CREATE POLICY "Admins can view all unlock requests"
ON public.account_unlock_requests FOR SELECT
USING (is_admin(auth.uid()));

-- 5. تشديد سياسات application_documents لإخفاء file_path
-- =====================================================
-- إنشاء view آمن للمستندات بدون file_path
CREATE OR REPLACE VIEW public.application_documents_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  application_id,
  document_type,
  file_name,
  file_size,
  mime_type,
  status,
  verification_notes,
  verified_at,
  created_at,
  updated_at
  -- حذف: file_path, verified_by
FROM public.application_documents;

-- 6. إضافة rate limiting لمحاولات التحقق من 2FA
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_2fa_rate_limit(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt_count integer;
BEGIN
  -- عد محاولات التحقق في آخر 5 دقائق
  SELECT COUNT(*) INTO attempt_count
  FROM staff_2fa_codes
  WHERE user_id = check_user_id
  AND created_at > now() - interval '5 minutes';
  
  -- السماح بحد أقصى 5 محاولات
  RETURN attempt_count < 5;
END;
$$;

-- 7. تسجيل محاولات الوصول المشبوهة
-- =====================================================
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  ip_address text,
  user_agent text,
  details jsonb DEFAULT '{}'::jsonb,
  severity text DEFAULT 'info',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- تفعيل RLS على جدول التدقيق الأمني
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- فقط المشرفون يمكنهم القراءة
CREATE POLICY "Only super admins can view security logs"
ON public.security_audit_log FOR SELECT
USING (has_permission(auth.uid(), 'manage_staff'));

-- السماح بالإدخال من Edge Functions
CREATE POLICY "System can insert security logs"
ON public.security_audit_log FOR INSERT
WITH CHECK (true);

-- منع التعديل والحذف
-- لا توجد سياسات UPDATE أو DELETE = ممنوع تماماً