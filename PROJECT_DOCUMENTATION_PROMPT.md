# 📋 Comprehensive Project Documentation Prompt
## مشروع "رحلات" - منصة خدمات التأشيرات

هذا المستند يوثق جميع ما تم تنفيذه في المشروع من تصميم وبرمجة ومزايا. يمكن استخدامه كـ Prompt لأي AI لفهم المشروع بالكامل.

---

## 🎯 نظرة عامة على المشروع

**اسم المشروع:** رحلات - منصة خدمات التأشيرات السياحية
**الهدف:** منصة متكاملة لتقديم طلبات التأشيرات السياحية لمختلف الدول، مع لوحة تحكم للإدارة والوكلاء.
**الجمهور المستهدف:** المواطنين السعوديين والمقيمين الراغبين بالسفر.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

### Frontend
- **React 18** - مكتبة بناء واجهات المستخدم
- **TypeScript** - للكتابة الآمنة للأنواع
- **Vite** - أداة البناء السريعة
- **Tailwind CSS** - إطار CSS للتنسيق
- **Shadcn/UI** - مكتبة مكونات UI جاهزة
- **React Router v6** - للتنقل بين الصفحات
- **React Query (TanStack Query)** - لإدارة حالة البيانات
- **Framer Motion** - للحركات والأنيميشن
- **Recharts** - للرسوم البيانية والتحليلات
- **Lucide React** - أيقونات SVG

### Backend (Lovable Cloud / Supabase)
- **Supabase Database** - قاعدة بيانات PostgreSQL
- **Supabase Auth** - نظام المصادقة
- **Supabase Storage** - تخزين الملفات
- **Edge Functions (Deno)** - وظائف الخادم
- **Row Level Security (RLS)** - أمان على مستوى الصفوف

### Mobile & PWA
- **Capacitor** - لتحويل التطبيق لتطبيقات أصلية iOS/Android
- **Vite PWA Plugin** - دعم تطبيقات الويب القابلة للتثبيت
- **Service Workers** - للعمل بدون إنترنت

---

## 🎨 نظام التصميم (Design System)

### الألوان (Color Palette)
```css
/* Light Mode */
--primary: 217 91% 40%;        /* أزرق احترافي */
--secondary: 210 40% 96%;      /* رمادي فاتح */
--success: 142 76% 36%;        /* أخضر للنجاح */
--warning: 38 92% 50%;         /* برتقالي للتحذير */
--destructive: 0 84% 60%;      /* أحمر للخطأ */
--info: 199 89% 48%;           /* أزرق فاتح للمعلومات */

/* Dark Mode - مدعوم بالكامل */
```

### الخطوط (Typography)
- **العربية:** IBM Plex Sans Arabic
- **الإنجليزية:** Inter

### المكونات المخصصة
- `.glass-card` - بطاقات شفافة بتأثير blur
- `.gradient-primary` - تدرج لوني رئيسي
- `.gradient-hero` - تدرج لقسم البطل
- `.trust-badge` - شارات الثقة
- `.wizard-step-circle` - دوائر خطوات المعالج
- `.dropzone` - منطقة رفع الملفات
- `.timeline-item` - عناصر الخط الزمني

---

## 📱 دعم RTL/LTR (Bidirectional Support)

### التنفيذ
- نظام `LanguageContext` لإدارة اللغة والاتجاه
- تبديل تلقائي للخطوط حسب اللغة
- قلب الأيقونات (chevrons, arrows) في RTL
- تعديل التباعد والهوامش تلقائياً
- دعم الأرقام العربية والإنجليزية

### الملفات
- `src/contexts/LanguageContext.tsx`
- `src/components/layout/LanguageSwitcher.tsx`
- تنسيقات RTL في `src/index.css`

---

## 🔐 نظام المصادقة والأمان

### أنواع المستخدمين (Roles)
1. **Customer (عميل)** - يمكنه تقديم الطلبات وتتبعها
2. **Agent (وكيل)** - يعالج الطلبات المسندة إليه
3. **Admin (مدير)** - صلاحيات كاملة على النظام

### بوابة العملاء (`/auth`)
- تسجيل حساب جديد
- تسجيل الدخول
- استعادة كلمة المرور
- التحقق من البريد الإلكتروني

### بوابة الموظفين الآمنة (`/portal-x7k9m2`)
- **مسار عشوائي مخفي** للحماية
- **قفل الحساب** بعد 5 محاولات فاشلة (15 دقيقة)
- **CAPTCHA متقدم** قبل كل محاولة دخول
- **مصادقة ثنائية (2FA)** عبر رمز بالبريد الإلكتروني
- **إخفاء البريد الإلكتروني** أثناء التحقق
- **رموز الاسترداد الاحتياطية** (8 رموز مشفرة SHA-256)
- **نظام طلبات فك القفل** للحسابات المقفلة

### Edge Functions للأمان
- `send-staff-2fa` - إرسال رموز التحقق
- `create-staff-user` - إنشاء حسابات الموظفين
- `delete-staff-user` - حذف حسابات الموظفين

### نظام الصلاحيات الدقيقة (Granular Permissions)
```typescript
type StaffPermission = 
  | 'manage_applications'  // إدارة الطلبات
  | 'manage_users'         // إدارة المستخدمين
  | 'manage_staff'         // إدارة الموظفين (المالك فقط)
  | 'manage_settings'      // إدارة الإعدادات
  | 'manage_offers'        // إدارة العروض
  | 'manage_countries'     // إدارة الدول
  | 'manage_hero'          // إدارة الصفحة الرئيسية
  | 'view_reports'         // عرض التقارير
  | 'process_refunds'      // معالجة الاستردادات
  | 'manage_unlock_requests' // إدارة طلبات فك القفل
  | 'view_revenue';        // عرض الإيرادات
```

---

## 📄 الصفحات العامة (Public Pages)

### الصفحة الرئيسية (`/`)
- **Hero Section** - قسم البطل مع صور متحركة
- **Countries Section** - عرض الوجهات المتاحة
- **How It Works** - كيفية عمل الخدمة
- **Features Section** - مميزات المنصة
- **Stats Section** - إحصائيات المنصة
- **Partners Section** - الشركاء
- **Testimonials** - آراء العملاء
- **FAQ Section** - الأسئلة الشائعة
- **CTA Section** - دعوة للعمل

### صفحات أخرى
- `/destinations` - جميع الوجهات المتاحة
- `/country/:countryCode` - تفاصيل الدولة والتأشيرات
- `/apply` - تقديم طلب تأشيرة جديد
- `/track` - تتبع الطلب
- `/pricing` - الأسعار
- `/about` - عن المنصة
- `/contact` - اتصل بنا
- `/faq` - الأسئلة الشائعة
- `/terms` - الشروط والأحكام
- `/privacy` - سياسة الخصوصية
- `/refund` - سياسة الاسترداد
- `/track-refund` - تتبع طلب الاسترداد
- `/offers` - العروض الخاصة
- `/install` - دليل تثبيت التطبيق

---

## 📝 نظام تقديم الطلبات (Application Wizard)

### خطوات المعالج (6 خطوات)
1. **Step 1 - معلومات أساسية**
   - اختيار الدولة
   - اختيار نوع التأشيرة
   - تاريخ السفر

2. **Step 2 - تفاصيل التأشيرة**
   - عدد المسافرين (بالغين، أطفال، رضع)
   - حساب السعر التلقائي
   - بيانات التواصل

3. **Step 3 - المتطلبات**
   - عرض متطلبات التأشيرة
   - التأكيد على قراءة المتطلبات

4. **Step 4 - المستندات**
   - رفع المستندات المطلوبة
   - صور الجواز، الصور الشخصية، إلخ

5. **Step 5 - الشروط**
   - الموافقة على الشروط والأحكام
   - سياسة الاسترداد

6. **Step 6 - الدفع**
   - ملخص الطلب
   - الدفع الإلكتروني

### مميزات النظام
- **حفظ تلقائي للمسودات** - يحفظ التقدم تلقائياً
- **استرجاع المسودات** - استئناف الطلبات غير المكتملة
- **ملخص السعر الديناميكي** - حساب فوري للتكلفة
- **التحقق من المدخلات** - تصفية الأحرف العربية من الحقول الإنجليزية
- **شريط التقدم** - يعرض نسبة الإنجاز

---

## 👤 لوحة العميل

### صفحاتي (`/my-applications`)
- قائمة جميع طلباتي
- فلترة حسب الحالة
- استئناف المسودات

### تفاصيل الطلب (`/application`)
- عرض حالة الطلب
- الخط الزمني للتحديثات
- نظام المراسلات مع الفريق
- تحميل المستندات الإضافية
- تتبع الدفع

### الملف الشخصي (`/profile`)
- تعديل البيانات الشخصية
- معلومات جواز السفر
- رقم الهاتف
- رصيد المحفظة

---

## 🏢 لوحة تحكم الوكيل (`/agent`)

### الداشبورد
- إحصائيات الطلبات المسندة
- الطلبات العاجلة
- تقرير الأداء

### إدارة الطلبات
- قائمة الطلبات المسندة
- تغيير حالة الطلب
- إضافة ملاحظات داخلية
- التواصل مع العميل
- رفع نتائج العمل

### طلبات النقل
- طلب نقل طلب لوكيل آخر
- عرض حالة طلبات النقل

---

## 🔧 لوحة تحكم المدير (`/admin`)

### الداشبورد الرئيسي
- **Hero Welcome Section** - تحية ديناميكية حسب الوقت
- **إحصائيات سريعة** - إجمالي الطلبات، المعلقة، المعتمدة، المرفوضة
- **رسوم بيانية تفاعلية** - اتجاهات الطلبات، توزيع الحالات
- **مركز التحكم** - أزرار الإجراءات السريعة
- **المهام العاجلة** - طلبات تحتاج اهتمام فوري
- **نشاط حديث** - آخر التحديثات

### إدارة الطلبات (`/admin/applications`)
- جدول شامل بجميع الطلبات
- فلترة متقدمة (الحالة، الدولة، التاريخ)
- بحث نصي
- تصدير لـ Excel
- إسناد الطلبات للوكلاء

### تفاصيل الطلب (`/admin/applications/:id`)
- عرض كامل بيانات الطلب
- تغيير الحالة
- إضافة ملاحظات
- عرض المستندات (مع تسجيل الوصول)
- مراجعة أعمال الوكيل
- التواصل مع العميل

### إدارة المستخدمين (`/admin/users`)
- **العملاء** - جدول بجميع العملاء
- **الموظفين** - إدارة حسابات المديرين والوكلاء
  - إنشاء حساب موظف جديد
  - تعديل الأدوار
  - تعديل الصلاحيات
  - حذف الحسابات

### الإعدادات (`/admin/settings`)
- **إدارة الدول** - إضافة/تعديل/حذف الدول
- **إدارة أنواع التأشيرات** - الأسعار، المتطلبات، المدة
- **إدارة الصلاحيات** - تخصيص صلاحيات الموظفين

### إدارة العروض (`/admin/offers`)
- إنشاء عروض خاصة
- تحديد الخصومات والفترات
- تفعيل/إيقاف العروض

### إدارة الصفحة الرئيسية (`/admin/hero`)
- تعديل نصوص Hero Section
- إدارة صور الوجهات المميزة
- ترتيب الوجهات بالسحب والإفلات

### إدارة طلبات الاسترداد (`/admin/refunds`)
- مراجعة طلبات الاسترداد
- الموافقة/الرفض مع الملاحظات

### سجلات تسجيل الدخول (`/admin/login-attempts`)
- عرض جميع محاولات الدخول
- الناجحة والفاشلة
- عنوان IP والمتصفح

### طلبات فك القفل (`/admin/unlock-requests`)
- مراجعة طلبات فك قفل الحسابات
- الموافقة/الرفض

### طلبات نقل الوكلاء (`/admin/agent-requests`)
- إدارة طلبات نقل الطلبات بين الوكلاء

### العمليات الحساسة (`/admin/sensitive-operations`)
- نظام موافقة ثنائية للعمليات الخطرة
- حذف موظف يحتاج موافقة مالك آخر

### سجلات الوصول للمستندات (`/admin/document-logs`)
- تتبع من شاهد أي مستند ومتى

### إعدادات المالك (`/admin/owner-settings`)
- إدارة النسخ الاحتياطية
- تصدير البيانات

---

## 🗄️ قاعدة البيانات (Database Schema)

### الجداول الرئيسية

```sql
-- المستخدمين والملفات الشخصية
profiles (id, user_id, full_name, phone, passport_number, nationality, ...)
user_roles (id, user_id, role)
staff_permissions (id, user_id, permission, granted_by)

-- الدول والتأشيرات
countries (id, code, name, flag_url, is_active, display_order)
visa_types (id, country_id, name, price, child_price, infant_price, processing_days, requirements, ...)

-- الطلبات
applications (id, user_id, visa_type_id, status, travel_date, assigned_agent_id, ...)
application_documents (id, application_id, document_type, file_path, status, ...)
application_status_history (id, application_id, old_status, new_status, changed_by, ...)
application_notes (id, application_id, author_id, content, note_type)
application_messages (id, application_id, sender_id, content, sender_type, priority, is_read)

-- المدفوعات
payments (id, application_id, amount, status, stripe_payment_intent_id, ...)

-- العروض
special_offers (id, title, country_name, discount_percentage, original_price, sale_price, ...)

-- الأمان
staff_login_attempts (id, email, success, failure_reason, ip_address, user_agent)
staff_2fa_codes (id, user_id, email, code, expires_at, used)
staff_recovery_codes (id, user_id, code_hash, code_index, used)
account_unlock_requests (id, user_id, email, status, reason, ...)
pending_sensitive_operations (id, operation_type, target_user_id, requested_by, status, ...)
document_access_log (id, document_id, application_id, accessed_by, access_type, ...)
security_audit_log (id, event_type, user_id, details, severity, ...)

-- الإعدادات
hero_settings (id, key, value, value_en, category, type)
hero_destinations (id, name, name_en, country, image_url, display_order)

-- الإشعارات
notifications (id, user_id, title, message, type, is_read, action_url)

-- الاسترداد
refund_requests (id, application_number, email, reason, status, ...)

-- المحفظة
wallet_transactions (id, user_id, amount, type, balance_after, ...)

-- النسخ الاحتياطية
system_backups (id, file_name, file_path, tables_included, created_by)
```

### سياسات RLS (Row Level Security)
- جميع الجداول محمية بسياسات RLS صارمة
- العملاء يرون بياناتهم فقط
- الوكلاء يرون الطلبات المسندة إليهم
- المديرون يرون كل شيء
- وظائف مساعدة: `is_admin()`, `is_agent()`, `is_application_owner()`, `is_assigned_agent()`, `has_permission()`

---

## 📱 دعم الجوال (Mobile Support)

### PWA (Progressive Web App)
- **Manifest** - اسم التطبيق، الأيقونات، الاتجاه
- **Service Worker** - التخزين المؤقت للعمل بدون إنترنت
- **صفحة التثبيت** (`/install`) - تعليمات تثبيت ذكية حسب الجهاز

### Capacitor (Native Apps)
- **إعداد كامل** لـ iOS و Android
- **ملف التكوين** `capacitor.config.ts`
- جاهز للرفع على App Store و Google Play

### التصميم المتجاوب
- تصميم Mobile-First
- دعم جميع أحجام الشاشات
- قائمة جانبية للجوال (MobileNavDrawer)
- أزرار كبيرة سهلة اللمس

---

## 🔔 نظام الإشعارات

### إشعارات داخلية
- جدول `notifications` لتخزين الإشعارات
- مكون `NotificationBell` في الـ Header
- تحديث في الوقت الفعلي

### إشعارات البريد الإلكتروني
- رسالة ترحيب للموظفين الجدد
- رموز التحقق 2FA
- (قابل للتوسيع لإشعارات أخرى)

---

## 💬 نظام المراسلات

### المراسلات داخل الطلب
- تواصل بين العميل والفريق
- أولويات الرسائل (عادية، مهمة، عاجلة)
- إرفاق ملفات
- حالة القراءة

### التنفيذ
- `src/components/messages/ApplicationMessages.tsx`
- `src/hooks/useApplicationMessages.ts`

---

## 📊 التقارير والتحليلات

### رسوم بيانية
- **اتجاهات الطلبات** - رسم بياني خطي
- **توزيع الحالات** - رسم دائري
- **طلبات حسب الدولة** - رسم أعمدة
- **أداء الوكلاء** - مقارنة بين الوكلاء

### المكونات
- `ApplicationTrendsChart`
- `StatusDistributionChart`
- `CountryApplicationsChart`
- `AgentPerformanceChart`
- `AgentsComparisonTable`
- `RevenueStatsCard`
- `PerformanceMetricsCard`

---

## 🎨 المكونات المميزة

### مكونات UI مخصصة
- `CountryCodePicker` - اختيار رمز الدولة للهاتف
- `CountryCityPicker` - اختيار الدولة والمدينة
- `DatePicker` - منتقي التاريخ
- `FilePreview` - معاينة الملفات المرفوعة
- `SARSymbol` - رمز الريال السعودي

### مكونات التطبيق
- `WizardStepper` - شريط خطوات المعالج
- `TravelerCounter` - عداد المسافرين
- `PriceSummaryCard` - ملخص السعر
- `ProcessingProgressBar` - شريط تقدم المعالجة

### مكونات الأمان
- `AdvancedCaptcha` - اختبار CAPTCHA متقدم
- `TwoFactorVerification` - التحقق الثنائي
- `RecoveryCodesDisplay` - عرض رموز الاسترداد
- `RecoveryCodeVerification` - التحقق برموز الاسترداد
- `UnlockRequestForm` - نموذج طلب فك القفل

---

## 🔧 الـ Hooks المخصصة

```typescript
// المصادقة والصلاحيات
useAuth()           // حالة المستخدم والجلسة
usePermissions()    // التحقق من الصلاحيات

// البيانات
useApplicationMessages()  // رسائل الطلب
useAgentPerformance()     // أداء الوكيل
useSpecialOffers()        // العروض الخاصة
useUrgentTasks()          // المهام العاجلة
useDraftApplication()     // حفظ المسودات

// الإشعارات
useAdminNotifications()   // إشعارات المدير
useRealtimeNotifications() // إشعارات فورية

// النظام
useDebounce()             // تأخير البحث
useDocumentAccessLog()    // تسجيل الوصول للمستندات
useSensitiveOperations()  // العمليات الحساسة
useSystemBackups()        // النسخ الاحتياطية
```

---

## 📁 هيكل الملفات

```
src/
├── assets/              # الصور والأيقونات
├── components/
│   ├── admin/           # مكونات لوحة المدير
│   ├── agent/           # مكونات لوحة الوكيل
│   ├── apply/           # مكونات معالج التقديم
│   ├── auth/            # مكونات المصادقة
│   ├── home/            # أقسام الصفحة الرئيسية
│   ├── layout/          # Header, Footer, Layouts
│   ├── messages/        # نظام المراسلات
│   ├── notifications/   # الإشعارات
│   ├── ui/              # مكونات Shadcn
│   └── visa/            # بطاقات التأشيرات
├── contexts/
│   ├── ApplicationContext.tsx  # سياق الطلب
│   ├── AuthContext.tsx         # سياق المصادقة
│   └── LanguageContext.tsx     # سياق اللغة
├── hooks/               # Hooks مخصصة
├── integrations/
│   └── supabase/        # عميل Supabase والأنواع
├── lib/                 # أدوات مساعدة
├── pages/
│   ├── admin/           # صفحات المدير
│   ├── agent/           # صفحات الوكيل
│   └── ...              # الصفحات العامة
├── types/               # تعريفات TypeScript
├── App.tsx              # المكون الرئيسي
├── index.css            # التنسيقات الأساسية
└── main.tsx             # نقطة الدخول

supabase/
├── config.toml          # إعدادات Supabase
└── functions/           # Edge Functions
    ├── _shared/cors.ts
    ├── create-staff-user/
    ├── delete-staff-user/
    └── send-staff-2fa/

public/
├── favicon.ico
├── pwa-192x192.png
├── pwa-512x512.png
└── robots.txt

capacitor.config.ts      # إعدادات التطبيق الأصلي
vite.config.ts           # إعدادات Vite
tailwind.config.ts       # إعدادات Tailwind
```

---

## 🚀 الميزات المستقبلية المقترحة

1. **إشعارات Push** - للجوال والويب
2. **دفع Stripe** - تكامل كامل مع المدفوعات
3. **تقارير PDF** - تصدير الطلبات كـ PDF
4. **API عامة** - للتكامل مع أنظمة خارجية
5. **دعم لغات إضافية** - الفرنسية، الألمانية
6. **نظام نقاط الولاء** - مكافآت للعملاء المتكررين
7. **تكامل WhatsApp** - إشعارات عبر واتساب
8. **تتبع GPS** - لمتابعة شحن جوازات السفر

---

## 📋 ملخص المزايا الرئيسية

### للعملاء
✅ تقديم طلبات التأشيرة بخطوات بسيطة
✅ حفظ تلقائي للمسودات
✅ تتبع حالة الطلب
✅ التواصل المباشر مع الفريق
✅ عروض وخصومات خاصة
✅ تطبيق قابل للتثبيت (PWA)

### للوكلاء
✅ لوحة تحكم مخصصة
✅ إدارة الطلبات المسندة
✅ رفع نتائج العمل
✅ تقارير الأداء
✅ طلبات نقل الطلبات

### للمديرين
✅ داشبورد شامل بالإحصائيات
✅ إدارة كاملة للطلبات والمستخدمين
✅ نظام صلاحيات متقدم
✅ تقارير ورسوم بيانية
✅ إدارة المحتوى (الدول، العروض، Hero)
✅ سجلات أمنية شاملة
✅ نسخ احتياطية

### الأمان
✅ Row Level Security على كل الجداول
✅ مصادقة ثنائية للموظفين
✅ قفل الحسابات التلقائي
✅ CAPTCHA متقدم
✅ تسجيل جميع العمليات
✅ موافقة ثنائية للعمليات الحساسة

---

## 🎯 استخدام هذا الـ Prompt

يمكن استخدام هذا المستند كـ Prompt لأي AI لـ:
1. فهم بنية المشروع بالكامل
2. إضافة ميزات جديدة متوافقة
3. إصلاح المشاكل
4. توثيق المشروع
5. تدريب مطورين جدد
6. مراجعة الكود

---

**تاريخ التوثيق:** فبراير 2026
**إصدار المشروع:** 1.0.0
