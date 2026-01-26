import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Country, VisaType } from '@/types/database';

// Import new sections
import HeroSection from '@/components/home/HeroSection';
import CountriesSection from '@/components/home/CountriesSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import CTASection from '@/components/home/CTASection';

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

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Countries */}
      <CountriesSection countries={countries} visaTypes={visaTypes} t={t} />

      {/* How It Works */}
      <HowItWorksSection t={t} />

      {/* Features */}
      <FeaturesSection t={t} />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* FAQ Preview */}
      <section className="py-20 bg-background">
        <div className="container-section">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              الأسئلة الشائعة
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('faq.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('faq.subtitle')}
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-4">
            {[
              { q: 'كم تستغرق معالجة طلب التأشيرة؟', a: 'تختلف مدة المعالجة حسب نوع التأشيرة والدولة. عادة ما تتراوح بين 3-14 يوم عمل.' },
              { q: 'ما هي المستندات المطلوبة؟', a: 'تختلف المستندات حسب نوع التأشيرة. بشكل عام: جواز سفر ساري، صور شخصية، كشف حساب بنكي، وحجوزات السفر.' },
              { q: 'هل الأسعار شاملة لرسوم السفارة؟', a: 'نوضح في كل خدمة ما إذا كانت الرسوم شاملة أو غير شاملة لرسوم التأشيرة الحكومية.' },
            ].map((faq, index) => (
              <Card key={index} className="group hover:shadow-md transition-shadow border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base group-hover:text-primary transition-colors">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button variant="outline" className="rounded-full" asChild>
              <Link to="/faq">
                {t('faq.viewAll')}
                <ArrowIcon className="h-4 w-4 ms-2 rtl-flip" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection t={t} />
    </div>
  );
}
