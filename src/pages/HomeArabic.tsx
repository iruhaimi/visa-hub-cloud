import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft,
  ArrowRight,
  Shield, 
  Clock, 
  CheckCircle2, 
  Star,
  Plane,
  FileText,
  CreditCard,
  Headphones,
  Users,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Country, VisaType } from '@/types/database';
import HeroSection from '@/components/home/HeroSection';

const testimonials = [
  {
    name: 'أحمد محمد',
    role: 'رجل أعمال',
    content: 'خدمة ممتازة وسريعة. حصلت على تأشيرة شنغن في 5 أيام فقط!',
    rating: 5,
  },
  {
    name: 'سارة العلي',
    role: 'طالبة',
    content: 'فريق محترف ساعدني في الحصول على تأشيرة الدراسة بكل سهولة.',
    rating: 5,
  },
  {
    name: 'خالد الأحمد',
    role: 'سائح',
    content: 'أفضل خدمة تأشيرات استخدمتها. متابعة مستمرة وتواصل ممتاز.',
    rating: 5,
  },
];

export default function HomeArabic() {
  const { t, direction } = useLanguage();
  const [countries, setCountries] = useState<Country[]>([]);
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    async function fetchData() {
      const [countriesRes, visaTypesRes] = await Promise.all([
        supabase.from('countries').select('*').eq('is_active', true).order('name'),
        supabase.from('visa_types').select('*, country:countries(*)').eq('is_active', true),
      ]);

      if (!countriesRes.error && countriesRes.data) {
        setCountries(countriesRes.data as Country[]);
      }
      if (!visaTypesRes.error && visaTypesRes.data) {
        setVisaTypes(visaTypesRes.data as VisaType[]);
      }
      setIsLoading(false);
    }

    fetchData();
  }, []);

  // Get minimum price per country
  const getCountryMinPrice = (countryId: string) => {
    const countryVisas = visaTypes.filter(v => v.country_id === countryId);
    if (countryVisas.length === 0) return null;
    return Math.min(...countryVisas.map(v => v.price));
  };

  // Get average processing days per country
  const getCountryProcessingDays = (countryId: string) => {
    const countryVisas = visaTypes.filter(v => v.country_id === countryId);
    if (countryVisas.length === 0) return null;
    return Math.min(...countryVisas.map(v => v.processing_days));
  };

  const features = [
    {
      icon: Headphones,
      title: t('features.support'),
      description: t('features.supportDesc'),
    },
    {
      icon: Clock,
      title: t('features.tracking'),
      description: t('features.trackingDesc'),
    },
    {
      icon: Users,
      title: t('features.experts'),
      description: t('features.expertsDesc'),
    },
    {
      icon: Shield,
      title: t('features.transparent'),
      description: t('features.transparentDesc'),
    },
  ];

  const steps = [
    { icon: Globe, title: t('howItWorks.step1.title'), desc: t('howItWorks.step1.desc') },
    { icon: FileText, title: t('howItWorks.step2.title'), desc: t('howItWorks.step2.desc') },
    { icon: Plane, title: t('howItWorks.step3.title'), desc: t('howItWorks.step3.desc') },
    { icon: CreditCard, title: t('howItWorks.step4.title'), desc: t('howItWorks.step4.desc') },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Countries */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="container-section">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('countries.title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('countries.subtitle')}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {countries.slice(0, 8).map((country) => {
              const minPrice = getCountryMinPrice(country.id);
              const processingDays = getCountryProcessingDays(country.id);
              
              return (
                <Card key={country.id} className="group overflow-hidden transition-all hover:shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={country.flag_url || `https://flagcdn.com/w80/${country.code.toLowerCase()}.png`}
                        alt={country.name}
                        className="h-10 w-14 rounded object-cover shadow-sm"
                      />
                      <div>
                        <CardTitle className="text-lg">{country.name}</CardTitle>
                        {processingDays && (
                          <CardDescription className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {processingDays} {t('countries.processingDays')}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {minPrice && (
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm text-muted-foreground">{t('countries.startingFrom')}</span>
                        <span className="text-2xl font-bold text-primary">${minPrice}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link to={`/country/${country.code}`}>
                          {t('countries.details')}
                        </Link>
                      </Button>
                      <Button size="sm" className="flex-1" asChild>
                        <Link to={`/apply?country=${country.code}`}>
                          {t('countries.applyNow')}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link to="/destinations">
                {t('countries.viewAll')}
                <ArrowIcon className="h-4 w-4 ms-2 rtl-flip" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 bg-muted/50">
        <div className="container-section">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('howItWorks.title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('howItWorks.subtitle')}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((item, index) => (
              <div key={index} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <item.icon className="h-8 w-8" />
                </div>
                <div className="absolute -top-2 end-1/2 translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <h3 className="mt-6 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="container-section">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('features.title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 bg-card shadow-sm text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24 bg-muted/50">
        <div className="container-section">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              آراء عملائنا
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              انضم لآلاف العملاء السعداء
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="bg-card">
                <CardContent className="pt-6">
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="mt-4 text-muted-foreground">{testimonial.content}</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="container-section">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('faq.title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('faq.subtitle')}
            </p>
          </div>

          <div className="mt-12 mx-auto max-w-3xl space-y-4">
            {[
              { q: 'كم تستغرق معالجة طلب التأشيرة؟', a: 'تختلف مدة المعالجة حسب نوع التأشيرة والدولة. عادة ما تتراوح بين 3-14 يوم عمل.' },
              { q: 'ما هي المستندات المطلوبة؟', a: 'تختلف المستندات حسب نوع التأشيرة. بشكل عام: جواز سفر ساري، صور شخصية، كشف حساب بنكي، وحجوزات السفر.' },
              { q: 'هل الأسعار شاملة لرسوم السفارة؟', a: 'نوضح في كل خدمة ما إذا كانت الرسوم شاملة أو غير شاملة لرسوم التأشيرة الحكومية.' },
            ].map((faq, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link to="/faq">
                {t('faq.viewAll')}
                <ArrowIcon className="h-4 w-4 ms-2 rtl-flip" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 gradient-hero">
        <div className="container-section text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            جاهز لبدء رحلتك؟
          </h2>
          <p className="mt-4 text-lg text-white/80">
            قدّم على تأشيرتك اليوم وسافر بثقة
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/apply">
                {t('nav.startApplication')}
                <ArrowIcon className="h-4 w-4 ms-2 rtl-flip" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
              <Link to="/contact">{t('nav.contact')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
