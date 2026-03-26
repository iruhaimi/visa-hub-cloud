import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteContent } from '@/hooks/useSiteContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield } from 'lucide-react';

export default function Privacy() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { data: content, isLoading } = useSiteContent('privacy');

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
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {isRTL ? heroData.title : (heroData.title_en || heroData.title || 'سياسة الخصوصية')}
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
              <div className="flex items-center gap-4">
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

          {/* Sections */}
          <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            {sectionsData.map((section: any, index: number) => (
              <Card key={index}>
                <CardHeader className="pb-3" dir={isRTL ? 'rtl' : 'ltr'}>
                  <CardTitle className={`flex items-center gap-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <span>{isRTL ? section.title : (section.title_en || section.title)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="text-muted-foreground whitespace-pre-line leading-relaxed prose prose-sm max-w-none"
                    style={{ textAlign: isRTL ? 'right' : 'left' }}
                    dangerouslySetInnerHTML={{ 
                      __html: (isRTL ? section.content : (section.content_en || section.content))
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    }}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
