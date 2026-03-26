import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  FileText,
  Shield,
  Users,
  Star,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteContent } from '@/hooks/useSiteContent';
import type { Country, VisaType } from '@/types/database';

const fallbackFaqs = [
  { question: 'كم تستغرق عملية التقديم؟', question_en: 'How long does the application process take?', answer: 'يختلف وقت المعالجة حسب نوع التأشيرة.', answer_en: 'The processing time varies by visa type.' },
  { question: 'ما المستندات التي أحتاجها؟', question_en: 'What documents do I need?', answer: 'المستندات المطلوبة مذكورة في قسم المتطلبات.', answer_en: 'Required documents are listed in the requirements section.' },
  { question: 'هل يمكنني تتبع حالة طلبي؟', question_en: 'Can I track my application status?', answer: 'نعم! بمجرد تقديم طلبك، يمكنك تتبع حالته.', answer_en: 'Yes! Once you submit your application, you can track its status.' },
  { question: 'ماذا لو تم رفض طلبي؟', question_en: 'What if my application is rejected?', answer: 'إذا تم رفض طلبك، سنشرح الأسباب ونرشدك.', answer_en: 'If rejected, we will explain the reasons and guide you.' },
  { question: 'هل الدفع آمن؟', question_en: 'Is my payment secure?', answer: 'بالتأكيد. نستخدم تشفيراً معيارياً.', answer_en: 'Absolutely. We use industry-standard encryption.' },
];

export default function VisaDetail() {
  const { visaId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { data: cmsContent } = useSiteContent('visa_detail');
  const [visa, setVisa] = useState<VisaType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const labels = cmsContent?.labels || {};
  const faqItems = cmsContent?.faqs?.items || fallbackFaqs;

  const t = (key: string, fallbackAr: string, fallbackEn: string) => {
    return isRTL ? (labels[key] || fallbackAr) : (labels[key + '_en'] || labels[key] || fallbackEn);
  };

  useEffect(() => {
    async function fetchVisa() {
      if (!visaId) { setError('Visa ID not provided'); setIsLoading(false); return; }
      const { data, error: fetchError } = await supabase
        .from('visa_types')
        .select('*, country:countries(*)')
        .eq('id', visaId)
        .eq('is_active', true)
        .maybeSingle();
      if (fetchError) { setError('Failed to load visa details'); } 
      else if (!data) { setError('Visa not found'); }
      else { setVisa(data as VisaType); }
      setIsLoading(false);
    }
    fetchVisa();
  }, [visaId]);

  const handleApply = () => {
    if (user) navigate(`/dashboard/apply/${visaId}`);
    else navigate(`/auth?mode=signup&redirect=/dashboard/apply/${visaId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-section py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
            <div><Skeleton className="h-80 w-full rounded-lg" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !visa) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-section py-16 text-center">
          <div className="mx-auto h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('not_found', 'التأشيرة غير موجودة', 'Visa Not Found')}</h1>
          <p className="text-muted-foreground mb-6">{t('not_found_desc', 'التأشيرة التي تبحث عنها غير متوفرة.', 'The visa you are looking for does not exist or is no longer available.')}</p>
          <Button asChild><Link to="/visa-services">{t('browse_btn', 'تصفح خدمات التأشيرات', 'Browse Visa Services')}</Link></Button>
        </div>
      </div>
    );
  }

  const country = visa.country as Country;
  const requirements = Array.isArray(visa.requirements) ? visa.requirements : [];

  return (
    <div className="min-h-screen bg-background">
      <section className="gradient-hero py-12">
        <div className="container-section">
          <Link to="/visa-services" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('back_link', 'عودة لخدمات التأشيرات', 'Back to Visa Services')}
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <img src={country?.flag_url || `https://flagcdn.com/w80/${country?.code.toLowerCase()}.png`} alt={country?.name} className="h-16 w-24 rounded-lg object-cover shadow-lg" />
            <div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">{visa.name}</h1>
              <p className="text-lg text-white/80 mt-1">{country?.name}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="container-section">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader><CardTitle>{t('overview', 'نظرة عامة', 'Overview')}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    {visa.description || (isRTL ? `قدّم على ${visa.name} إلى ${country?.name}.` : `Apply for a ${visa.name} to ${country?.name}. Our expert team will guide you through the entire application process.`)}
                  </p>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <Clock className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">{t('processing', 'المعالجة', 'Processing')}</p>
                      <p className="font-semibold">{visa.processing_days} {t('days', 'يوم', 'Days')}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">{t('validity', 'الصلاحية', 'Validity')}</p>
                      <p className="font-semibold">{visa.validity_days || t('varies', 'متنوعة', 'Varies')} {visa.validity_days ? t('days', 'يوم', 'Days') : ''}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <Users className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">{t('max_stay', 'الحد الأقصى للإقامة', 'Max Stay')}</p>
                      <p className="font-semibold">{visa.max_stay_days || t('varies', 'متنوعة', 'Varies')} {visa.max_stay_days ? t('days', 'يوم', 'Days') : ''}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <FileText className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">{t('entry_type', 'نوع الدخول', 'Entry Type')}</p>
                      <p className="font-semibold capitalize">{visa.entry_type}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('requirements', 'المتطلبات', 'Requirements')}</CardTitle>
                  <CardDescription>{t('requirements_desc', 'تأكد من توفر جميع المستندات المطلوبة قبل التقديم', 'Make sure you have all the required documents before applying')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {requirements.length > 0 ? (
                    <ul className="space-y-3">
                      {requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">{t('no_requirements', 'سيتم عرض المتطلبات أثناء عملية التقديم.', 'Requirements will be displayed during the application process.')}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>{isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}</CardTitle></CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqItems.map((faq: any, index: number) => (
                      <AccordionItem key={index} value={`faq-${index}`}>
                        <AccordionTrigger className="text-left">{isRTL ? faq.question : (faq.question_en || faq.question)}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">{isRTL ? faq.answer : (faq.answer_en || faq.answer)}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-primary">{visa.price}</span>
                      <span className="text-muted-foreground">ر.س</span>
                    </div>
                    <CardDescription>{t('per_application', 'لكل طلب', 'per application')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button size="lg" className="w-full" onClick={handleApply}>{t('apply_btn', 'قدّم الآن', 'Apply Now')}</Button>
                    <Separator />
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground"><Shield className="h-4 w-4 text-success" /><span>{t('secure_payment', 'دفع آمن', 'Secure payment processing')}</span></div>
                      <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4 text-success" /><span>{t('fast_processing', 'معالجة سريعة', 'Fast processing')}</span></div>
                      <div className="flex items-center gap-2 text-muted-foreground"><Star className="h-4 w-4 text-success" /><span>{t('approval_rate', 'نسبة القبول 98%', '98% approval rate')}</span></div>
                      <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4 text-success" /><span>{t('expert_help', 'مساعدة متخصصة مشمولة', 'Expert assistance included')}</span></div>
                    </div>
                    <Separator />
                    <div className="text-xs text-muted-foreground"><p>{t('price_note', 'السعر يشمل جميع رسوم المعالجة.', 'Price includes all processing fees.')}</p></div>
                  </CardContent>
                </Card>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border bg-card p-3 text-center">
                    <Shield className="h-6 w-6 mx-auto text-primary mb-1" />
                    <p className="text-xs font-medium">{t('ssl', 'SSL آمن', 'SSL Secure')}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3 text-center">
                    <Star className="h-6 w-6 mx-auto text-primary mb-1" />
                    <p className="text-xs font-medium">{t('trusted', 'خدمة موثوقة', 'Trusted Service')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}