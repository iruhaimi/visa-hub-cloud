import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Eye,
  Lock,
  Database,
  Share2,
  Trash2,
  Mail,
  Globe,
  Cookie
} from 'lucide-react';

export default function Privacy() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const sections = [
    {
      icon: Shield,
      titleAr: 'الامتثال لنظام حماية البيانات الشخصية',
      titleEn: 'Personal Data Protection Law Compliance',
      contentAr: `نلتزم في وكالة عطلات رحلاتكم بالعمل وفقاً لأحكام **نظام حماية البيانات الشخصية** الصادر بموجب المرسوم الملكي رقم (م/19) بتاريخ 09/02/1443هـ الموافق 16/09/2021م، والمعدّل بموجب المرسوم الملكي رقم (م/148) بتاريخ 05/09/1444هـ الموافق 27/03/2023م.

**الجهة المنظمة:**
نعمل وفقاً لأنظمة **الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا)** - الجهة المختصة بتنظيم وحماية البيانات الشخصية في المملكة العربية السعودية.

**التزاماتنا:**
• نعالج بياناتك الشخصية فقط للأغراض المحددة والمشروعة
• نحصل على موافقتك قبل جمع أو معالجة بياناتك
• نحترم حقوقك في الوصول والتصحيح والحذف
• نطبق إجراءات أمنية صارمة لحماية بياناتك
• نلتزم بالإفصاح والشفافية في التعامل مع بياناتك`,
      contentEn: `At Otolat Rahlatcom, we operate in full compliance with the **Personal Data Protection Law (PDPL)** issued pursuant to Royal Decree No. (M/19) dated 09/02/1443 AH corresponding to 16/09/2021 G, and amended pursuant to Royal Decree No. (M/148) dated 05/09/1444 AH corresponding to 27/03/2023 G.

**Regulatory Authority:**
We operate under the supervision of the **Saudi Data and Artificial Intelligence Authority (SDAIA)** - the competent authority for regulating and protecting personal data in the Kingdom of Saudi Arabia.

**Our Commitments:**
• We process your personal data only for specified and legitimate purposes
• We obtain your consent before collecting or processing your data
• We respect your rights to access, correct, and delete your data
• We implement strict security measures to protect your data
• We are committed to disclosure and transparency in handling your data`
    },
    {
      icon: Database,
      titleAr: 'المعلومات التي نجمعها',
      titleEn: 'Information We Collect',
      contentAr: `نجمع المعلومات التالية عند استخدامك لخدماتنا:

**المعلومات الشخصية:**
• الاسم الكامل
• البريد الإلكتروني
• رقم الهاتف
• تاريخ الميلاد
• الجنسية
• رقم جواز السفر وتاريخ انتهائه
• العنوان

**المستندات:**
• صور جواز السفر
• الصور الشخصية
• كشوف الحسابات البنكية
• حجوزات السفر والفنادق
• أي مستندات أخرى مطلوبة للتأشيرة

**معلومات الاستخدام:**
• عنوان IP
• نوع المتصفح
• صفحات الموقع التي تزورها
• تاريخ ووقت الزيارة`,
      contentEn: `We collect the following information when you use our services:

**Personal Information:**
• Full name
• Email address
• Phone number
• Date of birth
• Nationality
• Passport number and expiry date
• Address

**Documents:**
• Passport copies
• Personal photos
• Bank statements
• Travel and hotel bookings
• Any other documents required for the visa

**Usage Information:**
• IP address
• Browser type
• Website pages you visit
• Date and time of visit`
    },
    {
      icon: Eye,
      titleAr: 'كيف نستخدم معلوماتك',
      titleEn: 'How We Use Your Information',
      contentAr: `نستخدم معلوماتك للأغراض التالية:

1. **معالجة طلبات التأشيرة**: تقديم طلباتك للسفارات والقنصليات
2. **التواصل معك**: إرسال تحديثات حول طلبك، الرد على استفساراتك
3. **تحسين خدماتنا**: تحليل كيفية استخدام موقعنا لتحسين تجربة المستخدم
4. **الامتثال القانوني**: تلبية المتطلبات القانونية والتنظيمية
5. **الحماية من الاحتيال**: حماية موقعنا وعملائنا من الأنشطة الاحتيالية
6. **التسويق** (بموافقتك): إرسال عروض وتحديثات حول خدماتنا`,
      contentEn: `We use your information for the following purposes:

1. **Processing visa applications**: Submitting your applications to embassies and consulates
2. **Communicating with you**: Sending updates about your application, responding to inquiries
3. **Improving our services**: Analyzing website usage to improve user experience
4. **Legal compliance**: Meeting legal and regulatory requirements
5. **Fraud protection**: Protecting our website and customers from fraudulent activities
6. **Marketing** (with your consent): Sending offers and updates about our services`
    },
    {
      icon: Share2,
      titleAr: 'مشاركة المعلومات',
      titleEn: 'Information Sharing',
      contentAr: `قد نشارك معلوماتك مع الأطراف التالية:

**السفارات والقنصليات**: لمعالجة طلبات التأشيرة

**مقدمي الخدمات**: شركات الدفع، خدمات التخزين السحابي

**الجهات الحكومية**: عند الطلب القانوني

**لا نبيع** معلوماتك الشخصية لأي طرف ثالث أبداً.`,
      contentEn: `We may share your information with the following parties:

**Embassies and Consulates**: For processing visa applications

**Service Providers**: Payment companies, cloud storage services

**Government Authorities**: When legally required

We **never sell** your personal information to any third party.`
    },
    {
      icon: Lock,
      titleAr: 'حماية المعلومات',
      titleEn: 'Information Security',
      contentAr: `نتخذ إجراءات أمنية صارمة لحماية معلوماتك:

• **تشفير SSL**: جميع البيانات المنقولة مشفرة
• **تخزين آمن**: المستندات محفوظة في خوادم مشفرة
• **التحكم في الوصول**: وصول محدود للموظفين المصرح لهم فقط
• **المراقبة المستمرة**: مراقبة الأنظمة للكشف عن أي نشاط مشبوه
• **التحديثات الأمنية**: تحديث منتظم لأنظمتنا الأمنية`,
      contentEn: `We take strict security measures to protect your information:

• **SSL Encryption**: All transmitted data is encrypted
• **Secure Storage**: Documents stored on encrypted servers
• **Access Control**: Limited access to authorized personnel only
• **Continuous Monitoring**: Systems monitored for suspicious activity
• **Security Updates**: Regular updates to our security systems`
    },
    {
      icon: Trash2,
      titleAr: 'الاحتفاظ بالبيانات وحذفها',
      titleEn: 'Data Retention and Deletion',
      contentAr: `**مدة الاحتفاظ:**
• نحتفظ ببياناتك للمدة اللازمة لمعالجة طلبك
• بعد اكتمال الطلب، نحتفظ بالبيانات لمدة سنتين للرجوع إليها
• بعد ذلك، يتم حذف البيانات بشكل آمن

**حقك في الحذف:**
يمكنك طلب حذف بياناتك في أي وقت عبر التواصل معنا. سنقوم بحذف جميع بياناتك خلال 30 يوماً، ما لم يكن هناك التزام قانوني بالاحتفاظ بها.`,
      contentEn: `**Retention Period:**
• We retain your data for as long as needed to process your application
• After completion, we keep data for two years for reference
• After that, data is securely deleted

**Your Right to Deletion:**
You can request deletion of your data at any time by contacting us. We will delete all your data within 30 days, unless legally required to retain it.`
    },
    {
      icon: Cookie,
      titleAr: 'ملفات تعريف الارتباط',
      titleEn: 'Cookies',
      contentAr: `نستخدم ملفات تعريف الارتباط (Cookies) لـ:

• **تحسين تجربة التصفح**: تذكر تفضيلاتك
• **تحليل الاستخدام**: فهم كيفية استخدام الموقع
• **الإعلانات**: عرض إعلانات ملائمة (بموافقتك)

يمكنك التحكم في ملفات تعريف الارتباط من إعدادات متصفحك.`,
      contentEn: `We use cookies for:

• **Improving browsing experience**: Remembering your preferences
• **Usage analytics**: Understanding how the website is used
• **Advertising**: Showing relevant ads (with your consent)

You can control cookies through your browser settings.`
    },
    {
      icon: Globe,
      titleAr: 'حقوقك',
      titleEn: 'Your Rights',
      contentAr: `لديك الحقوق التالية فيما يتعلق ببياناتك:

• **الوصول**: طلب نسخة من بياناتك الشخصية
• **التصحيح**: طلب تصحيح أي معلومات غير دقيقة
• **الحذف**: طلب حذف بياناتك
• **الاعتراض**: الاعتراض على معالجة بياناتك لأغراض معينة
• **النقل**: طلب نقل بياناتك إلى جهة أخرى
• **سحب الموافقة**: سحب موافقتك على المعالجة في أي وقت

لممارسة أي من هذه الحقوق، تواصل معنا عبر البريد الإلكتروني.`,
      contentEn: `You have the following rights regarding your data:

• **Access**: Request a copy of your personal data
• **Correction**: Request correction of inaccurate information
• **Deletion**: Request deletion of your data
• **Objection**: Object to processing for certain purposes
• **Portability**: Request transfer of your data to another party
• **Withdraw Consent**: Withdraw your consent at any time

To exercise any of these rights, contact us via email.`
    },
    {
      icon: Mail,
      titleAr: 'الاتصال بنا',
      titleEn: 'Contact Us',
      contentAr: `لأي استفسارات حول سياسة الخصوصية أو بياناتك الشخصية:

**وكالة عطلات رحلاتكم للسياحة والسفر:**
البريد الإلكتروني: info@rhalat.com
الهاتف: 920034158

**العنوان:**
الرياض - حي الربيع - شارع أبي بن معاذ الأنصاري

آخر تحديث: يناير 2024`,
      contentEn: `For any inquiries about our privacy policy or your personal data:

**Otolat Rahlatcom Travel Agency:**
Email: info@rhalat.com
Phone: 920034158

**Address:**
Riyadh - Al-Rabi' neighborhood - Ubay Bin Moaath Alansari Rd

Last updated: January 2024`
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container-section text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </h1>
          <p className="text-lg opacity-90">
            {isRTL 
              ? 'كيف نحمي خصوصيتك ونتعامل مع بياناتك'
              : 'How we protect your privacy and handle your data'
            }
          </p>
        </div>
      </section>

      <div className="container-section py-12">
        <div className="max-w-4xl mx-auto">
          {/* PDPL Compliance Notice */}
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="py-6" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row' : 'flex-row'}`}>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className={`text-muted-foreground leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL 
                      ? 'نلتزم بتطبيق نظام حماية البيانات الشخصية السعودي والصادر من الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا) لضمان حماية خصوصيتك وفقاً لأعلى المعايير.'
                      : 'We are committed to applying the Saudi Personal Data Protection Law issued by the Saudi Data and Artificial Intelligence Authority (SDAIA) to ensure your privacy is protected according to the highest standards.'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Introduction */}
          <Card className="mb-8">
            <CardContent className="py-6" dir={isRTL ? 'rtl' : 'ltr'}>
              <p className={`text-muted-foreground leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>
                {isRTL 
                  ? 'نحن في وكالة عطلات رحلاتكم نلتزم بحماية خصوصيتك. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك الشخصية عند استخدام موقعنا وخدماتنا.'
                  : 'At Otolat Rahlatcom, we are committed to protecting your privacy. This policy explains how we collect, use, and protect your personal information when using our website and services.'
                }
              </p>
            </CardContent>
          </Card>

          {/* Sections */}
          <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Card key={index}>
                  <CardHeader className="pb-3" dir={isRTL ? 'rtl' : 'ltr'}>
                    <CardTitle className={`flex items-center gap-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span>{isRTL ? section.titleAr : section.titleEn}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="text-muted-foreground whitespace-pre-line leading-relaxed prose prose-sm max-w-none"
                      style={{ textAlign: isRTL ? 'right' : 'left' }}
                      dangerouslySetInnerHTML={{ 
                        __html: (isRTL ? section.contentAr : section.contentEn)
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      }}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
