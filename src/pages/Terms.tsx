import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteContent } from '@/hooks/useSiteContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Scale, 
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';

export default function Terms() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { data: content, isLoading } = useSiteContent('terms');

  const heroData = content?.hero || {};
  const sectionsData = content?.sections?.items || [];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16">
          <div className="container-section text-center">
            <Skeleton className="w-16 h-16 rounded-full mx-auto mb-6" />
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
          </div>
        </section>
        <div className="container-section py-12 max-w-4xl mx-auto space-y-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container-section text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6">
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {isRTL ? heroData.title : (heroData.title_en || heroData.title || 'الشروط والأحكام')}
          </h1>
          <p className="text-lg opacity-90">
            {isRTL 
              ? `آخر تحديث: ${heroData.last_updated || ''}`
              : `Last updated: ${heroData.last_updated_en || heroData.last_updated || ''}`
            }
          </p>
        </div>
      </section>

      <div className="container-section py-12">
        <div className="max-w-4xl mx-auto">
          {/* Quick Summary */}
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="py-6" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="flex gap-4">
                <Info className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h3 className="font-semibold mb-2">
                    {isRTL ? 'ملخص سريع' : 'Quick Summary'}
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{isRTL ? 'نحن نساعدك في تقديم طلبات التأشيرة ولسنا جهة إصدار' : 'We help you submit visa applications, we are not the issuing authority'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{isRTL ? 'رسوم الخدمة غير قابلة للاسترداد' : 'Service fees are non-refundable'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{isRTL ? 'أنت مسؤول عن دقة المعلومات والمستندات المقدمة' : 'You are responsible for accuracy of information and documents provided'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>{isRTL ? 'لا نضمن الموافقة على أي طلب تأشيرة' : 'We do not guarantee approval of any visa application'}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Full Terms */}
          <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            {sectionsData.map((section: any, index: number) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    {isRTL ? section.title : (section.title_en || section.title)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? section.content : (section.content_en || section.content)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
