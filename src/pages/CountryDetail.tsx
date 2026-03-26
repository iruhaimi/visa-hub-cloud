import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  ArrowRight,
  CheckCircle2, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteContent } from '@/hooks/useSiteContent';
import { VisaCard } from '@/components/visa/VisaCard';
import SchengenDetail from './SchengenDetail';
import type { Country, VisaType } from '@/types/database';

export default function CountryDetail() {
  const { countryCode } = useParams();
  const { t: translate, direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const { data: cmsContent } = useSiteContent('country_detail');
  const [country, setCountry] = useState<Country | null>(null);
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const isSchengen = countryCode?.toUpperCase() === 'SCHENGEN';

  const labels = cmsContent?.labels || {};
  const t = (key: string, fallbackAr: string, fallbackEn: string) => {
    return isRTL ? (labels[key] || fallbackAr) : (labels[key + '_en'] || labels[key] || fallbackEn);
  };

  const generalRequirements = cmsContent?.requirements?.items || [
    { text: 'جواز سفر ساري المفعول (6 أشهر على الأقل)', text_en: 'Valid passport (6+ months validity)' },
    { text: 'صور شخصية بخلفية بيضاء', text_en: 'Passport photos with white background' },
    { text: 'كشف حساب بنكي آخر 3 أشهر', text_en: 'Bank statement for last 3 months' },
    { text: 'حجز فندقي مؤكد', text_en: 'Confirmed hotel booking' },
    { text: 'حجز طيران ذهاب وعودة', text_en: 'Round-trip flight booking' },
    { text: 'تأمين سفر ساري', text_en: 'Valid travel insurance' },
  ];

  useEffect(() => {
    async function fetchData() {
      if (!countryCode || isSchengen) { setIsLoading(false); return; }
      const { data: countryData, error: countryError } = await supabase
        .from('countries').select('*').eq('code', countryCode.toUpperCase()).maybeSingle();
      if (countryError || !countryData) { setIsLoading(false); return; }
      setCountry(countryData as Country);
      const { data: visaData } = await supabase
        .from('visa_types').select('*').eq('country_id', countryData.id).eq('is_active', true).order('price');
      if (visaData) setVisaTypes(visaData as VisaType[]);
      setIsLoading(false);
    }
    fetchData();
  }, [countryCode, isSchengen]);

  if (isSchengen) return <SchengenDetail />;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-section py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-48 w-full rounded-lg mb-8" />
          <div className="grid gap-6 md:grid-cols-2"><Skeleton className="h-64 w-full rounded-lg" /><Skeleton className="h-64 w-full rounded-lg" /></div>
        </div>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-section py-16 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('not_found', 'الدولة غير موجودة', 'Country Not Found')}</h1>
          <p className="text-muted-foreground mb-6">{t('not_found_desc', 'الدولة التي تبحث عنها غير متوفرة حالياً', 'The country you are looking for is not currently available')}</p>
          <Button asChild><Link to="/destinations">{translate('countries.viewAll')}</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="gradient-hero py-12">
        <div className="container-section">
          <Link to="/destinations" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6">
            <ArrowIcon className="h-4 w-4 rotate-180 rtl:rotate-0" />
            {t('back_link', 'عودة للدول', 'Back to Countries')}
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <img src={country.flag_url || `https://flagcdn.com/w160/${country.code.toLowerCase()}.png`} alt={country.name} className="h-20 w-28 rounded-lg object-cover shadow-lg" />
            <div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">{isRTL ? `تأشيرات ${country.name}` : `${country.name} Visas`}</h1>
              <p className="text-lg text-white/80 mt-1">{isRTL ? `${visaTypes.length} نوع تأشيرة متاح` : `${visaTypes.length} visa types available`}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-section">
          <h2 className="text-2xl font-bold mb-6">{t('visa_types_title', 'أنواع التأشيرات المتاحة', 'Available Visa Types')}</h2>
          {visaTypes.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">{t('no_visas', 'لا توجد تأشيرات متاحة حالياً لهذه الدولة', 'No visas currently available for this country')}</p></CardContent></Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visaTypes.map((visa) => <VisaCard key={visa.id} visa={visa} country={country} />)}
            </div>
          )}
        </div>
      </section>

      <section className="py-12 bg-muted/50">
        <div className="container-section">
          <h2 className="text-2xl font-bold mb-6">{t('requirements_title', 'المتطلبات العامة', 'General Requirements')}</h2>
          <Card>
            <CardContent className="py-6">
              <ul className="grid gap-3 sm:grid-cols-2">
                {generalRequirements.map((req: any, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>{isRTL ? req.text : (req.text_en || req.text)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
                {t('requirements_note', '* قد تختلف المتطلبات حسب نوع التأشيرة والجنسية.', '* Requirements may vary based on visa type and nationality.')}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}