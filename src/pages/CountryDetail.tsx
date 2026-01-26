import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
import { VisaCard } from '@/components/visa/VisaCard';
import type { Country, VisaType } from '@/types/database';

export default function CountryDetail() {
  const { countryCode } = useParams();
  const navigate = useNavigate();
  const { t, direction } = useLanguage();
  const [country, setCountry] = useState<Country | null>(null);
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    async function fetchData() {
      if (!countryCode) return;

      const { data: countryData, error: countryError } = await supabase
        .from('countries')
        .select('*')
        .eq('code', countryCode.toUpperCase())
        .maybeSingle();

      if (countryError || !countryData) {
        setIsLoading(false);
        return;
      }

      setCountry(countryData as Country);

      const { data: visaData } = await supabase
        .from('visa_types')
        .select('*')
        .eq('country_id', countryData.id)
        .eq('is_active', true)
        .order('price');

      if (visaData) {
        setVisaTypes(visaData as VisaType[]);
      }

      setIsLoading(false);
    }

    fetchData();
  }, [countryCode]);

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

  if (!country) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-section py-16 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">الدولة غير موجودة</h1>
          <p className="text-muted-foreground mb-6">
            الدولة التي تبحث عنها غير متوفرة حالياً
          </p>
          <Button asChild>
            <Link to="/destinations">عرض كل الدول</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="gradient-hero py-12">
        <div className="container-section">
          <Link 
            to="/destinations" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6"
          >
            <ArrowIcon className="h-4 w-4 rotate-180 rtl:rotate-0" />
            عودة للدول
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <img
              src={country.flag_url || `https://flagcdn.com/w160/${country.code.toLowerCase()}.png`}
              alt={country.name}
              className="h-20 w-28 rounded-lg object-cover shadow-lg"
            />
            <div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">
                تأشيرات {country.name}
              </h1>
              <p className="text-lg text-white/80 mt-1">
                {visaTypes.length} نوع تأشيرة متاح
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visa Types */}
      <section className="py-12">
        <div className="container-section">
          <h2 className="text-2xl font-bold mb-6">أنواع التأشيرات المتاحة</h2>

          {visaTypes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">لا توجد تأشيرات متاحة حالياً لهذه الدولة</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visaTypes.map((visa) => (
                <VisaCard key={visa.id} visa={visa} country={country} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* General Requirements */}
      <section className="py-12 bg-muted/50">
        <div className="container-section">
          <h2 className="text-2xl font-bold mb-6">المتطلبات العامة</h2>
          <Card>
            <CardContent className="py-6">
              <ul className="grid gap-3 sm:grid-cols-2">
                {[
                  'جواز سفر ساري المفعول (6 أشهر على الأقل)',
                  'صور شخصية بخلفية بيضاء',
                  'كشف حساب بنكي آخر 3 أشهر',
                  'حجز فندقي مؤكد',
                  'حجز طيران ذهاب وعودة',
                  'تأمين سفر ساري',
                ].map((req, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
                * قد تختلف المتطلبات حسب نوع التأشيرة والجنسية. سيتم عرض المتطلبات الكاملة أثناء عملية التقديم.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
