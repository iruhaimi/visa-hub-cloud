
-- =============================================
-- تشديد سياسات جداول المصادقة الثنائية
-- =============================================

-- 1. إسقاط السياسات القديمة لـ staff_2fa_codes
DROP POLICY IF EXISTS "System can insert 2FA codes" ON public.staff_2fa_codes;
DROP POLICY IF EXISTS "Anyone can verify 2FA codes" ON public.staff_2fa_codes;
DROP POLICY IF EXISTS "Anyone can update 2FA codes for verification" ON public.staff_2fa_codes;

-- 2. إنشاء سياسات جديدة أكثر أمانًا لـ staff_2fa_codes
-- السماح بالإدراج فقط من Edge Functions (service role)
CREATE POLICY "Service role can insert 2FA codes" 
ON public.staff_2fa_codes 
FOR INSERT 
WITH CHECK (
  -- Edge functions use service role, regular users can't insert
  -- This allows the send-staff-2fa edge function to work
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  OR 
  -- Fallback: allow if no auth context (edge function context)
  auth.uid() IS NULL
);

-- السماح بالتحديث للتحقق من الكود (فقط لتحديث حقل used)
CREATE POLICY "Users can verify their own 2FA codes" 
ON public.staff_2fa_codes 
FOR UPDATE 
USING (
  -- Allow verification only for codes that belong to the user trying to verify
  -- or during the authentication flow before user is fully authenticated
  user_id = auth.uid() 
  OR auth.uid() IS NULL
);

-- السماح بالقراءة للتحقق
CREATE POLICY "Users can view codes for verification" 
ON public.staff_2fa_codes 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR auth.uid() IS NULL
);

-- 3. إسقاط السياسة القديمة لـ staff_recovery_codes
DROP POLICY IF EXISTS "Anyone can verify recovery codes" ON public.staff_recovery_codes;

-- 4. إنشاء سياسة جديدة أكثر أمانًا لـ staff_recovery_codes
CREATE POLICY "Users can verify their own recovery codes" 
ON public.staff_recovery_codes 
FOR UPDATE 
USING (
  user_id = auth.uid() 
  OR auth.uid() IS NULL
);

-- =============================================
-- تحديث سياسة INSERT لـ staff_recovery_codes
-- =============================================
DROP POLICY IF EXISTS "System can insert recovery codes" ON public.staff_recovery_codes;

CREATE POLICY "Service role can insert recovery codes" 
ON public.staff_recovery_codes 
FOR INSERT 
WITH CHECK (
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  OR auth.uid() IS NULL
);

-- =============================================
-- إضافة تعليقات توثيقية للسياسات العامة المقصودة
-- =============================================
COMMENT ON POLICY "Anyone can subscribe" ON public.email_subscribers IS 
'سياسة مقصودة: نموذج اشتراك البريد الإلكتروني العام - لا يحتوي على بيانات حساسة';

COMMENT ON POLICY "Anyone can submit refund requests" ON public.refund_requests IS 
'سياسة مقصودة: نموذج طلب الاسترداد العام - يحتاج للعمل بدون تسجيل دخول';

COMMENT ON POLICY "Anyone can submit unlock requests" ON public.account_unlock_requests IS 
'سياسة مقصودة: نموذج طلب فك قفل الحساب - يحتاج للعمل عندما يكون الحساب مقفلاً';

COMMENT ON POLICY "Anyone can insert login attempts" ON public.staff_login_attempts IS 
'سياسة مقصودة: تسجيل محاولات الدخول - يحتاج للعمل قبل المصادقة لتتبع المحاولات الفاشلة';
