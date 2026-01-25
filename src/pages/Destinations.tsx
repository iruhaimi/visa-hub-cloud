import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Clock, 
  ArrowLeft,
  ArrowRight,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Country, VisaType } from '@/types/database';

export default function Destinations() {
  const { t, direction } = useLanguage();
  const [searchParams] = useSearchParams();
  const [countries, setCountries] = useState<Country[]>([]);
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');

  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    async function fetchData() {
      const [countriesRes, visaTypesRes] = await Promise.all([
        supabase.from('countries').select('*').eq('is_active', true).order('name'),
        supabase.from('visa_types').select('*').eq('is_active', true),
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

  const getCountryMinPrice = (countryId: string) => {
    const countryVisas = visaTypes.filter(v => v.country_id === countryId);
    if (countryVisas.length === 0) return null;
    return Math.min(...countryVisas.map(v => v.price));
  };

  const getCountryProcessingDays = (countryId: string) => {
    const countryVisas = visaTypes.filter(v => v.country_id === countryId);
    if (countryVisas.length === 0) return null;
    return Math.min(...countryVisas.map(v => v.processing_days));
  };

  const getVisaTypesCount = (countryId: string) => {
    return visaTypes.filter(v => v.country_id === countryId).length;
  };

  const filteredCountries = useMemo(() => {
    return countries.filter((country) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!country.name.toLowerCase().includes(query) && 
            !country.code.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [countries, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="gradient-hero py-16">
        <div className="container-section">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t('countries.title')}
            </h1>
            <p className="mt-4 text-lg text-white/80">
              {t('countries.subtitle')}
            </p>

            <div className="mt-8">
              <div className="flex gap-2 bg-white rounded-lg p-2 shadow-xl max-w-md mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t('hero.searchPlaceholder')}
                    className="border-0 ps-10 focus-visible:ring-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Countries Grid */}
      <section className="py-12">
        <div className="container-section">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {filteredCountries.length} {t('common.noResults').includes('لا') ? 'دولة' : 'countries'}
            </p>
            {searchQuery && (
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                <X className="h-4 w-4 me-1" />
                مسح البحث
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-10 w-14" />
                    <Skeleton className="h-5 w-32 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-10 w-full mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCountries.length === 0 ? (
            <div className="text-center py-16">
              <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">لا توجد نتائج</h3>
              <p className="text-muted-foreground">جرب البحث بكلمة أخرى</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCountries.map((country) => {
                const minPrice = getCountryMinPrice(country.id);
                const processingDays = getCountryProcessingDays(country.id);
                const visaCount = getVisaTypesCount(country.id);
                
                return (
                  <Card key={country.id} className="group overflow-hidden transition-all hover:shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={country.flag_url || `https://flagcdn.com/w80/${country.code.toLowerCase()}.png`}
                          alt={country.name}
                          className="h-12 w-16 rounded object-cover shadow-sm"
                        />
                        <div className="flex-1">
                          <CardTitle className="text-lg">{country.name}</CardTitle>
                          {visaCount > 0 && (
                            <CardDescription>
                              {visaCount} نوع تأشيرة
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        {processingDays && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{processingDays} {t('common.days')}</span>
                          </div>
                        )}
                        {minPrice && (
                          <div className="text-end">
                            <p className="text-xs text-muted-foreground">{t('countries.startingFrom')}</p>
                            <p className="text-xl font-bold text-primary">${minPrice}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link to={`/country/${country.code}`}>
                            {t('countries.details')}
                          </Link>
                        </Button>
                        <Button size="sm" className="flex-1" asChild>
                          <Link to={`/apply?country=${country.code}`}>
                            {t('countries.applyNow')}
                            <ArrowIcon className="h-4 w-4 ms-1 rtl-flip" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
