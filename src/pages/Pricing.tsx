import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  Clock, 
  Users, 
  CheckCircle2, 
  XCircle,
  Info,
  ArrowLeft,
  Calendar,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface Country {
  id: string;
  name: string;
  code: string;
  flag_url: string | null;
}

interface VisaType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  processing_days: number;
  validity_days: number | null;
  max_stay_days: number | null;
  entry_type: string | null;
  requirements: string[];
  country: Country;
  country_id: string;
}

// Pricing tiers for different traveler categories
const TRAVELER_PRICING = {
  adult: { label: 'بالغ (12+ سنة)', labelEn: 'Adult (12+)', multiplier: 1 },
  child: { label: 'طفل (6-12 سنة)', labelEn: 'Child (6-12)', multiplier: 0.75 },
  infant: { label: 'رضيع (أقل من 6)', labelEn: 'Infant (<6)', multiplier: 0.5 },
};

// Government visa fees (example data - these would typically come from DB)
const GOVERNMENT_FEES: Record<string, { amount: number; included: boolean }> = {
  'US': { amount: 160, included: false },
  'GB': { amount: 134, included: false },
  'CA': { amount: 100, included: false },
  'AU': { amount: 145, included: false },
  'DE': { amount: 80, included: true }, // Schengen
  'FR': { amount: 80, included: true }, // Schengen
  'AE': { amount: 0, included: true },
  'SA': { amount: 0, included: true },
  'JP': { amount: 25, included: true },
  'SG': { amount: 30, included: true },
};

export default function Pricing() {
  const { language, t } = useLanguage();
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');

  useEffect(() => {
    async function fetchData() {
      const [visaRes, countryRes] = await Promise.all([
        supabase
          .from('visa_types')
          .select('*, country:countries(*)')
          .eq('is_active', true),
        supabase
          .from('countries')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true })
      ]);

      if (visaRes.data) {
        setVisaTypes(visaRes.data as unknown as VisaType[]);
      }
      if (countryRes.data) {
        setCountries(countryRes.data);
      }
      setIsLoading(false);
    }

    fetchData();
  }, []);

  const getGovFee = (countryCode: string) => {
    return GOVERNMENT_FEES[countryCode] || { amount: 0, included: true };
  };

  const filteredVisaTypes = selectedCountry === 'all' 
    ? visaTypes 
    : visaTypes.filter(v => v.country?.code === selectedCountry);

  // Group visa types by country
  const visasByCountry = filteredVisaTypes.reduce((acc, visa) => {
    const countryCode = visa.country?.code || 'unknown';
    if (!acc[countryCode]) {
      acc[countryCode] = {
        country: visa.country,
        visas: []
      };
    }
    acc[countryCode].visas.push(visa);
    return acc;
  }, {} as Record<string, { country: Country; visas: VisaType[] }>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-section py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="gradient-hero py-16">
        <div className="container-section text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl mb-4">
            {language === 'ar' ? 'أسعار التأشيرات' : 'Visa Pricing'}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {language === 'ar' 
              ? 'أسعار شفافة وواضحة لجميع أنواع التأشيرات. نوضح لك بالتفصيل ما هو مشمول وما هو غير مشمول.'
              : 'Transparent and clear pricing for all visa types. We detail what is included and what is not.'}
          </p>
        </div>
      </section>

      {/* Pricing Info Cards */}
      <section className="py-8 bg-muted/30">
        <div className="container-section">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-primary/20">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {language === 'ar' ? 'رسوم الخدمة' : 'Service Fee'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' 
                      ? 'تشمل معالجة الطلب والمتابعة والدعم'
                      : 'Includes application processing, follow-up, and support'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-warning/20">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="rounded-full bg-warning/10 p-2">
                  <Info className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {language === 'ar' ? 'رسوم التأشيرة الحكومية' : 'Government Visa Fee'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' 
                      ? 'قد تكون شاملة أو تُدفع منفصلة حسب الدولة'
                      : 'May be included or paid separately depending on the country'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-success/20">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="rounded-full bg-success/10 p-2">
                  <Shield className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {language === 'ar' ? 'ضمان الخدمة' : 'Service Guarantee'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' 
                      ? 'استرداد كامل في حال رفض الطلب بسبب خطأ منا'
                      : 'Full refund if application is rejected due to our error'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Country Filter */}
      <section className="py-6 border-b">
        <div className="container-section">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-muted-foreground">
              {language === 'ar' ? 'فلترة حسب الدولة:' : 'Filter by country:'}
            </span>
            <Button
              variant={selectedCountry === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCountry('all')}
            >
              {language === 'ar' ? 'جميع الدول' : 'All Countries'}
            </Button>
            {countries.map((country) => (
              <Button
                key={country.id}
                variant={selectedCountry === country.code ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCountry(country.code)}
                className="gap-2"
              >
                <img 
                  src={country.flag_url || `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                  alt={country.name}
                  className="h-4 w-6 rounded object-cover"
                />
                {country.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Tables */}
      <section className="py-12">
        <div className="container-section space-y-12">
          {Object.entries(visasByCountry).map(([countryCode, { country, visas }]) => {
            const govFee = getGovFee(countryCode);
            
            return (
              <Card key={countryCode} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <img 
                        src={country?.flag_url || `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`}
                        alt={country?.name}
                        className="h-12 w-16 rounded-lg object-cover shadow"
                      />
                      <div>
                        <CardTitle className="text-xl">{country?.name}</CardTitle>
                        <CardDescription>
                          {visas.length} {language === 'ar' ? 'أنواع تأشيرات متاحة' : 'visa types available'}
                        </CardDescription>
                      </div>
                    </div>
                    
                    {/* Government Fee Status */}
                    <div className="flex items-center gap-2">
                      {govFee.included ? (
                        <Badge variant="default" className="bg-success gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {language === 'ar' ? 'رسوم التأشيرة شاملة' : 'Visa fee included'}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Info className="h-3 w-3" />
                          {language === 'ar' 
                            ? `رسوم التأشيرة منفصلة: $${govFee.amount}`
                            : `Visa fee separate: $${govFee.amount}`}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">
                            {language === 'ar' ? 'نوع التأشيرة' : 'Visa Type'}
                          </TableHead>
                          <TableHead className="text-center">
                            {language === 'ar' ? 'بالغ' : 'Adult'}
                            <span className="block text-xs font-normal text-muted-foreground">
                              (12+ {language === 'ar' ? 'سنة' : 'years'})
                            </span>
                          </TableHead>
                          <TableHead className="text-center">
                            {language === 'ar' ? 'طفل' : 'Child'}
                            <span className="block text-xs font-normal text-muted-foreground">
                              (6-12 {language === 'ar' ? 'سنة' : 'years'})
                            </span>
                          </TableHead>
                          <TableHead className="text-center">
                            {language === 'ar' ? 'رضيع' : 'Infant'}
                            <span className="block text-xs font-normal text-muted-foreground">
                              ({'<'}6 {language === 'ar' ? 'سنوات' : 'years'})
                            </span>
                          </TableHead>
                          <TableHead className="text-center">
                            <Clock className="h-4 w-4 inline-block me-1" />
                            {language === 'ar' ? 'المعالجة' : 'Processing'}
                          </TableHead>
                          <TableHead className="text-center">
                            <Calendar className="h-4 w-4 inline-block me-1" />
                            {language === 'ar' ? 'الصلاحية' : 'Validity'}
                          </TableHead>
                          <TableHead className="text-center">
                            {language === 'ar' ? 'نوع الدخول' : 'Entry Type'}
                          </TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visas.map((visa) => {
                          const adultPrice = visa.price;
                          const childPrice = Math.round(visa.price * TRAVELER_PRICING.child.multiplier);
                          const infantPrice = Math.round(visa.price * TRAVELER_PRICING.infant.multiplier);
                          
                          return (
                            <TableRow key={visa.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{visa.name}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {visa.description}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span className="font-bold text-primary">${adultPrice}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{language === 'ar' ? 'رسوم الخدمة للبالغ' : 'Adult service fee'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className="text-center">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span className="font-bold text-primary">${childPrice}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{language === 'ar' ? '75% من سعر البالغ' : '75% of adult price'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className="text-center">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span className="font-bold text-primary">${infantPrice}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{language === 'ar' ? '50% من سعر البالغ' : '50% of adult price'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline">
                                  {visa.processing_days} {language === 'ar' ? 'أيام' : 'days'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline">
                                  {visa.validity_days || '-'} {language === 'ar' ? 'يوم' : 'days'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge 
                                  variant={visa.entry_type === 'multiple' ? 'default' : 'secondary'}
                                >
                                  {visa.entry_type === 'multiple' 
                                    ? (language === 'ar' ? 'متعدد' : 'Multiple')
                                    : (language === 'ar' ? 'مفرد' : 'Single')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button asChild size="sm">
                                  <Link to={`/apply/${country?.code}`}>
                                    {language === 'ar' ? 'قدّم الآن' : 'Apply'}
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Fee Breakdown Note */}
                  <div className="p-4 bg-muted/30 border-t">
                    <div className="flex items-start gap-2 text-sm">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-muted-foreground">
                        {govFee.included ? (
                          <>
                            <span className="font-medium text-success">
                              {language === 'ar' 
                                ? 'الأسعار أعلاه شاملة رسوم التأشيرة الحكومية.'
                                : 'Prices above include government visa fees.'}
                            </span>
                            {' '}
                            {language === 'ar' 
                              ? 'لا توجد رسوم إضافية مخفية.'
                              : 'No hidden additional fees.'}
                          </>
                        ) : (
                          <>
                            <span className="font-medium text-warning">
                              {language === 'ar' 
                                ? `الأسعار أعلاه هي رسوم الخدمة فقط. رسوم التأشيرة الحكومية ($${govFee.amount}) تُدفع منفصلة.`
                                : `Prices above are service fees only. Government visa fee ($${govFee.amount}) is paid separately.`}
                            </span>
                            {' '}
                            {language === 'ar' 
                              ? 'تُدفع الرسوم الحكومية مباشرة للسفارة أو مركز التأشيرات.'
                              : 'Government fees are paid directly to the embassy or visa center.'}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-muted/30">
        <div className="container-section">
          <h2 className="text-2xl font-bold text-center mb-8">
            {language === 'ar' ? 'أسئلة شائعة عن الأسعار' : 'Pricing FAQs'}
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'ar' ? 'ما الفرق بين رسوم الخدمة ورسوم التأشيرة؟' : 'What\'s the difference between service and visa fees?'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {language === 'ar' 
                    ? 'رسوم الخدمة هي أتعابنا لمعالجة طلبك ومتابعته ودعمك. رسوم التأشيرة هي الرسوم الحكومية المفروضة من السفارة أو مركز التأشيرات.'
                    : 'Service fees are our charges for processing, following up, and supporting your application. Visa fees are government fees imposed by the embassy or visa center.'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'ar' ? 'هل هناك رسوم إضافية مخفية؟' : 'Are there any hidden fees?'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {language === 'ar' 
                    ? 'لا. جميع الرسوم موضحة بشفافية. إذا كانت رسوم التأشيرة غير شاملة، سنوضح ذلك بوضوح قبل الدفع.'
                    : 'No. All fees are transparently displayed. If visa fees are not included, we will clearly indicate this before payment.'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'ar' ? 'هل يوجد خصم للمجموعات؟' : 'Are there group discounts?'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {language === 'ar' 
                    ? 'نعم، نقدم خصومات للمجموعات من 5 أشخاص فأكثر. تواصل معنا للحصول على عرض سعر خاص.'
                    : 'Yes, we offer discounts for groups of 5 or more. Contact us for a special quote.'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'ar' ? 'ماذا لو تم رفض طلبي؟' : 'What if my application is rejected?'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {language === 'ar' 
                    ? 'إذا رُفض طلبك بسبب خطأ من جانبنا، نقدم استرداداً كاملاً. للرفض لأسباب أخرى، راجع سياسة الاسترجاع.'
                    : 'If your application is rejected due to our error, we offer a full refund. For rejection due to other reasons, please see our refund policy.'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 gradient-hero">
        <div className="container-section text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl mb-4">
            {language === 'ar' ? 'جاهز للبدء؟' : 'Ready to Get Started?'}
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            {language === 'ar' 
              ? 'اختر وجهتك وابدأ طلب التأشيرة الآن. فريقنا جاهز لمساعدتك.'
              : 'Choose your destination and start your visa application now. Our team is ready to help.'}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link to="/destinations">
                {language === 'ar' ? 'استعرض الوجهات' : 'Browse Destinations'}
              </Link>
            </Button>
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <Link to="/contact">
                {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
