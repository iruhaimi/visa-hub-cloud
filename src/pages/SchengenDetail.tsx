import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  ArrowRight,
  CheckCircle2, 
  Globe,
  Shield,
  Clock,
  MapPin,
  LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteContent } from '@/hooks/useSiteContent';
import SARSymbol from '@/components/ui/SARSymbol';
import { SCHENGEN_INFO, SCHENGEN_COUNTRY_CODES } from '@/lib/schengenCountries';
import type { Country, VisaType } from '@/types/database';

const ICON_MAP: Record<string, LucideIcon> = { Globe, Clock, Shield, MapPin };

export default function SchengenDetail() {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const { data: content } = useSiteContent('schengen');
  const [schengenCountries, setSchengenCountries] = useState<Country[]>([]);
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const t = (section: string, key: string, fallbackAr: string, fallbackEn: string) => {
    const s = content?.[section];
    if (!s) return isRTL ? fallbackAr : fallbackEn;
    return isRTL ? (s[key] || fallbackAr) : (s[key + '_en'] || s[key] || fallbackEn);
  };

  useEffect(() => {
    async function fetchData() {
      const { data: countriesData } = await supabase
        .from('countries')
        .select('*')
        .in('code', [...SCHENGEN_COUNTRY_CODES])
        .eq('is_active', true)
        .order('name');

      if (countriesData) {
        setSchengenCountries(countriesData as Country[]);
        if (countriesData.length > 0) {
          const { data: visaData } = await supabase
            .from('visa_types')
            .select('*')
            .eq('country_id', countriesData[0].id)
            .eq('is_active', true)
            .order('price');
          if (visaData) setVisaTypes(visaData as VisaType[]);
        }
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const benefits = content?.benefits?.items || [
    { icon: 'Globe', title: '27 دولة', title_en: '27 Countries', desc: 'تنقل حر بين جميع دول شنغن', desc_en: 'Free movement between all Schengen states' },
    { icon: 'Clock', title: '90 يوم', title_en: '90 Days', desc: 'إقامة حتى 90 يوم خلال 180 يوم', desc_en: 'Stay up to 90 days within 180 days' },
    { icon: 'Shield', title: 'تأشيرة موحدة', title_en: 'Unified Visa', desc: 'تقديم واحد لجميع الدول', desc_en: 'One application for all countries' },
  ];

  const requirements = content?.requirements?.items || [];
  const sections = content?.sections || {};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-section py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-48 w-full rounded-lg mb-8" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="gradient-hero py-12">
        <div className="container-section">
          <Link to="/destinations" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6">
            <ArrowIcon className="h-4 w-4 rotate-180 rtl:rotate-0" />
            {t('hero', 'back_link', 'عودة للوجهات', 'Back to Destinations')}
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <img src={SCHENGEN_INFO.flag_url} alt="Schengen" className="h-20 w-28 rounded-lg object-cover shadow-lg" />
            <div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">
                {t('hero', 'title', 'تأشيرة شنغن (الاتحاد الأوروبي)', 'Schengen Visa (EU)')}
              </h1>
              <p className="text-lg text-white/80 mt-1">
                {isRTL ? `${schengenCountries.length} دولة مشمولة بتأشيرة واحدة` : `${schengenCountries.length} countries covered with one visa`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-8 bg-muted/30">
        <div className="container-section">
          <div className="grid gap-4 md:grid-cols-3">
            {benefits.map((benefit: any, i: number) => {
              const IconComp = ICON_MAP[benefit.icon] || Globe;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="text-center h-full">
                    <CardContent className="pt-6">
                      <IconComp className="h-10 w-10 mx-auto text-primary mb-3" />
                      <h3 className="font-bold text-lg">{isRTL ? benefit.title : (benefit.title_en || benefit.title)}</h3>
                      <p className="text-sm text-muted-foreground">{isRTL ? benefit.desc : (benefit.desc_en || benefit.desc)}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Member Countries */}
      <section className="py-12">
        <div className="container-section">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            {isRTL ? (sections.member_countries || 'الدول المشمولة') : (sections.member_countries_en || 'Member Countries')}
          </h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {schengenCountries.map((country, i) => (
              <motion.div key={country.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                <Card className="hover:shadow-md transition-shadow cursor-default">
                  <CardContent className="p-3 flex items-center gap-3">
                    <img src={country.flag_url || `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`} alt={country.name} className="w-8 h-6 rounded object-cover" />
                    <span className="font-medium text-sm truncate">{country.name}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          {schengenCountries.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {isRTL ? (sections.no_countries || 'لم يتم إضافة دول شنغن بعد في النظام') : (sections.no_countries_en || 'Schengen countries have not been added to the system yet')}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Visa Types */}
      {visaTypes.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container-section">
            <h2 className="text-2xl font-bold mb-6">
              {isRTL ? (sections.visa_types || 'أنواع التأشيرات المتاحة') : (sections.visa_types_en || 'Available Visa Types')}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visaTypes.map((visa, i) => (
                <motion.div key={visa.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="h-full">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg">{visa.name}</h3>
                        <Badge variant="secondary">{visa.processing_days} {isRTL ? 'يوم' : 'days'}</Badge>
                      </div>
                      {visa.description && <p className="text-sm text-muted-foreground mb-4">{visa.description}</p>}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t">
                        <div className="flex items-center gap-1 text-xl font-bold text-primary">
                          {Number(visa.price).toLocaleString()}
                          <SARSymbol size="sm" className="text-primary" />
                        </div>
                        <Button size="sm" asChild>
                          <Link to="/apply?country=SCHENGEN">{isRTL ? 'قدّم الآن' : 'Apply Now'}</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Requirements */}
      <section className="py-12">
        <div className="container-section">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-success" />
            {isRTL ? (sections.requirements_title || 'متطلبات تأشيرة شنغن') : (sections.requirements_title_en || 'Schengen Visa Requirements')}
          </h2>
          <Card>
            <CardContent className="py-6" dir={isRTL ? 'rtl' : 'ltr'}>
              <ul className="grid gap-3 sm:grid-cols-2" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {(requirements.length > 0 ? requirements : [
                  { text: 'جواز سفر ساري المفعول', text_en: 'Valid passport' },
                ]).map((req: any, i: number) => (
                  <motion.li key={i} className="flex items-start gap-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span>{isRTL ? req.text : (req.text_en || req.text)}</span>
                  </motion.li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-muted-foreground" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL ? (sections.disclaimer || '* قد تختلف المتطلبات حسب سفارة الدولة المختارة.') : (sections.disclaimer_en || '* Requirements may vary by embassy.')}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-primary/5">
        <div className="container-section text-center">
          <h2 className="text-2xl font-bold mb-4">
            {t('cta', 'title', 'جاهز للتقديم؟', 'Ready to Apply?')}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            {t('cta', 'description', 'ابدأ طلب تأشيرة شنغن الآن واستمتع بالسفر لأكثر من 27 دولة أوروبية بتأشيرة واحدة', 'Start your Schengen visa application now and enjoy traveling to over 27 European countries with one visa')}
          </p>
          <Button size="lg" asChild>
            <Link to="/apply?country=SCHENGEN" className="gap-2">
              {t('cta', 'button', 'ابدأ التقديم', 'Start Application')}
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}