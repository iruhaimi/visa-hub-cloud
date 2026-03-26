import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Clock, 
  DollarSign, 
  Calendar,
  ArrowRight,
  CheckCircle2,
  X,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteContent } from '@/hooks/useSiteContent';
import type { Country, VisaType } from '@/types/database';

const fallbackCategories = [
  { value: 'all', label: 'جميع الأنواع', label_en: 'All Types' },
  { value: 'tourist', label: 'تأشيرة سياحية', label_en: 'Tourist Visa' },
  { value: 'business', label: 'تأشيرة عمل', label_en: 'Business Visa' },
  { value: 'student', label: 'تأشيرة طالب', label_en: 'Student Visa' },
  { value: 'work', label: 'تأشيرة وظيفة', label_en: 'Work Visa' },
  { value: 'transit', label: 'تأشيرة عبور', label_en: 'Transit Visa' },
];

const fallbackProcessingRanges = [
  { value: 'all', label: 'أي مدة', label_en: 'Any Duration' },
  { value: 'fast', label: '1-3 أيام', label_en: '1-3 Days' },
  { value: 'standard', label: '4-7 أيام', label_en: '4-7 Days' },
  { value: 'extended', label: '8-14 يوم', label_en: '8-14 Days' },
  { value: 'long', label: '15+ يوم', label_en: '15+ Days' },
];

const fallbackPriceRanges = [
  { value: 'all', label: 'جميع الأسعار', label_en: 'All Prices' },
  { value: 'budget', label: 'أقل من 50 ر.س', label_en: 'Under 50 SAR' },
  { value: 'mid', label: '50 - 150 ر.س', label_en: '50 - 150 SAR' },
  { value: 'premium', label: '150 - 300 ر.س', label_en: '150 - 300 SAR' },
  { value: 'luxury', label: 'أكثر من 300 ر.س', label_en: 'Over 300 SAR' },
];

export default function VisaServices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { data: cmsContent } = useSiteContent('visa_services');
  const [countries, setCountries] = useState<Country[]>([]);
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || 'all');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('type') || 'all');
  const [selectedProcessingTime, setSelectedProcessingTime] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const hero = cmsContent?.hero || {};
  const filters = cmsContent?.filters || {};
  const cardLabels = cmsContent?.card_labels || {};
  const visaCategories = cmsContent?.categories?.items || fallbackCategories;
  const processingTimeRanges = cmsContent?.processing_ranges?.items || fallbackProcessingRanges;
  const priceRanges = cmsContent?.price_ranges?.items || fallbackPriceRanges;

  const t = (obj: Record<string, any>, key: string, fallbackAr: string, fallbackEn: string) => {
    return isRTL ? (obj[key] || fallbackAr) : (obj[key + '_en'] || obj[key] || fallbackEn);
  };

  const getLabel = (item: any) => isRTL ? (item.label || '') : (item.label_en || item.label || '');

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [countriesRes, visaTypesRes] = await Promise.all([
        supabase.from('countries').select('*').eq('is_active', true).order('name'),
        supabase.from('visa_types').select('*, country:countries(*)').eq('is_active', true).order('name'),
      ]);
      if (!countriesRes.error && countriesRes.data) setCountries(countriesRes.data as Country[]);
      if (!visaTypesRes.error && visaTypesRes.data) setVisaTypes(visaTypesRes.data as VisaType[]);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const filteredVisaTypes = useMemo(() => {
    return visaTypes.filter((visa) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = visa.name.toLowerCase().includes(query) || visa.description?.toLowerCase().includes(query) || (visa.country as Country)?.name.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (selectedCountry !== 'all' && (visa.country as Country)?.code !== selectedCountry) return false;
      if (selectedCategory !== 'all' && !visa.name.toLowerCase().includes(selectedCategory.toLowerCase())) return false;
      if (selectedProcessingTime !== 'all') {
        const days = visa.processing_days;
        switch (selectedProcessingTime) {
          case 'fast': if (days > 3) return false; break;
          case 'standard': if (days < 4 || days > 7) return false; break;
          case 'extended': if (days < 8 || days > 14) return false; break;
          case 'long': if (days < 15) return false; break;
        }
      }
      if (selectedPriceRange !== 'all') {
        const price = visa.price;
        switch (selectedPriceRange) {
          case 'budget': if (price >= 50) return false; break;
          case 'mid': if (price < 50 || price > 150) return false; break;
          case 'premium': if (price < 150 || price > 300) return false; break;
          case 'luxury': if (price <= 300) return false; break;
        }
      }
      return true;
    });
  }, [visaTypes, searchQuery, selectedCountry, selectedCategory, selectedProcessingTime, selectedPriceRange]);

  const clearFilters = () => {
    setSearchQuery(''); setSelectedCountry('all'); setSelectedCategory('all'); setSelectedProcessingTime('all'); setSelectedPriceRange('all'); setSearchParams({});
  };

  const hasActiveFilters = searchQuery || selectedCountry !== 'all' || selectedCategory !== 'all' || selectedProcessingTime !== 'all' || selectedPriceRange !== 'all';

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t(filters, 'country_label', 'الدولة المقصودة', 'Destination Country')}</Label>
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="bg-background"><SelectValue placeholder={t(filters, 'all_countries', 'جميع الدول', 'All Countries')} /></SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">{t(filters, 'all_countries', 'جميع الدول', 'All Countries')}</SelectItem>
            {countries.map((country) => (
              <SelectItem key={country.id} value={country.code}>
                <div className="flex items-center gap-2">
                  <img src={country.flag_url || `https://flagcdn.com/w20/${country.code.toLowerCase()}.png`} alt="" className="h-4 w-5 rounded-sm object-cover" />
                  {country.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t(filters, 'visa_type_label', 'نوع التأشيرة', 'Visa Type')}</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {visaCategories.map((cat: any) => <SelectItem key={cat.value} value={cat.value}>{getLabel(cat)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t(filters, 'processing_label', 'وقت المعالجة', 'Processing Time')}</Label>
        <Select value={selectedProcessingTime} onValueChange={setSelectedProcessingTime}>
          <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {processingTimeRanges.map((range: any) => <SelectItem key={range.value} value={range.value}>{getLabel(range)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t(filters, 'price_label', 'نطاق السعر', 'Price Range')}</Label>
        <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
          <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {priceRanges.map((range: any) => <SelectItem key={range.value} value={range.value}>{getLabel(range)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          {t(filters, 'clear_filters', 'مسح جميع الفلاتر', 'Clear All Filters')}
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <section className="gradient-hero py-16">
        <div className="container-section">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t(hero, 'title', 'خدمات التأشيرات', 'Visa Services')}
            </h1>
            <p className="mt-4 text-lg text-white/80">
              {t(hero, 'description', 'ابحث وقدّم على تأشيرات لأكثر من 50 دولة حول العالم', 'Find and apply for visas to 50+ countries worldwide')}
            </p>
            <div className="mt-8">
              <div className="flex gap-2 bg-white rounded-lg p-2 shadow-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input type="text" placeholder={t(hero, 'search_placeholder', 'ابحث عن دولة أو نوع تأشيرة...', 'Search by country or visa type...')} className="border-0 pl-10 focus-visible:ring-0" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <Button type="button">{t(hero, 'search_btn', 'بحث', 'Search')}</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="container-section">
          <div className="flex gap-8">
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 rounded-lg border border-border bg-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {t(filters, 'filters_title', 'الفلاتر', 'Filters')}
                </h3>
                <FilterSidebar />
              </div>
            </aside>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-muted-foreground">
                  {isLoading ? <Skeleton className="h-5 w-32" /> : <span>{filteredVisaTypes.length} {t(filters, 'results_suffix', 'خدمة تأشيرة', 'visa services found')}</span>}
                </div>
                <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <Filter className="mr-2 h-4 w-4" />
                      {t(cardLabels, 'filter_mobile', 'فلاتر', 'Filters')}
                      {hasActiveFilters && <Badge variant="secondary" className="ml-2">{t(cardLabels, 'active', 'نشط', 'Active')}</Badge>}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <SheetHeader>
                      <SheetTitle>{t(cardLabels, 'filter_sheet_title', 'فلترة خدمات التأشيرات', 'Filter Visa Services')}</SheetTitle>
                      <SheetDescription>{t(cardLabels, 'filter_sheet_desc', 'ضيّق البحث باستخدام الفلاتر', 'Narrow down your search with filters')}</SheetDescription>
                    </SheetHeader>
                    <div className="mt-6"><FilterSidebar /></div>
                  </SheetContent>
                </Sheet>
              </div>

              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {searchQuery && <Badge variant="secondary" className="gap-1">Search: {searchQuery}<button onClick={() => setSearchQuery('')}><X className="h-3 w-3" /></button></Badge>}
                  {selectedCountry !== 'all' && <Badge variant="secondary" className="gap-1">Country: {countries.find(c => c.code === selectedCountry)?.name}<button onClick={() => setSelectedCountry('all')}><X className="h-3 w-3" /></button></Badge>}
                  {selectedCategory !== 'all' && <Badge variant="secondary" className="gap-1">Type: {getLabel(visaCategories.find((c: any) => c.value === selectedCategory))}<button onClick={() => setSelectedCategory('all')}><X className="h-3 w-3" /></button></Badge>}
                  {selectedProcessingTime !== 'all' && <Badge variant="secondary" className="gap-1">Time: {getLabel(processingTimeRanges.find((r: any) => r.value === selectedProcessingTime))}<button onClick={() => setSelectedProcessingTime('all')}><X className="h-3 w-3" /></button></Badge>}
                  {selectedPriceRange !== 'all' && <Badge variant="secondary" className="gap-1">Price: {getLabel(priceRanges.find((r: any) => r.value === selectedPriceRange))}<button onClick={() => setSelectedPriceRange('all')}><X className="h-3 w-3" /></button></Badge>}
                </div>
              )}

              {isLoading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardHeader className="pb-4"><div className="flex items-start gap-3"><Skeleton className="h-10 w-14 rounded" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-24" /></div></div></CardHeader>
                      <CardContent className="space-y-4"><Skeleton className="h-16 w-full" /><div className="grid grid-cols-2 gap-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div></CardContent>
                      <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                    </Card>
                  ))}
                </div>
              ) : filteredVisaTypes.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4"><Search className="h-10 w-10 text-muted-foreground" /></div>
                  <h3 className="text-lg font-semibold">{t(filters, 'no_results', 'لم يتم العثور على خدمات تأشيرات', 'No visa services found')}</h3>
                  <p className="text-muted-foreground mt-2">{t(filters, 'no_results_desc', 'حاول تعديل الفلاتر أو كلمة البحث', 'Try adjusting your filters or search query')}</p>
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>{t(filters, 'clear_filters', 'مسح جميع الفلاتر', 'Clear All Filters')}</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredVisaTypes.map((visa) => {
                    const country = visa.country as Country;
                    return (
                      <Card key={visa.id} className="overflow-hidden transition-all hover:shadow-lg group">
                        <CardHeader className="pb-4">
                          <div className="flex items-start gap-3">
                            <img src={country?.flag_url || `https://flagcdn.com/w80/${country?.code.toLowerCase()}.png`} alt={country?.name} className="h-10 w-14 rounded object-cover shadow-sm" />
                            <div className="flex-1 min-w-0"><CardTitle className="text-lg truncate">{visa.name}</CardTitle><CardDescription className="truncate">{country?.name}</CardDescription></div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {visa.description || (isRTL ? `قدّم على ${visa.name} إلى ${country?.name}. معالجة سريعة ومساعدة متخصصة.` : `Apply for a ${visa.name} to ${country?.name}. Fast processing and expert assistance.`)}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg bg-muted/50 p-3">
                              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1"><Clock className="h-3.5 w-3.5" />{t(cardLabels, 'processing', 'المعالجة', 'Processing')}</div>
                              <p className="font-semibold text-sm">{visa.processing_days} {t(cardLabels, 'days', 'يوم', 'Days')}</p>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-3">
                              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1"><Calendar className="h-3.5 w-3.5" />{t(cardLabels, 'validity', 'الصلاحية', 'Validity')}</div>
                              <p className="font-semibold text-sm">{visa.validity_days ? `${visa.validity_days} ${t(cardLabels, 'days', 'يوم', 'Days')}` : t(cardLabels, 'varies', 'متنوعة', 'Varies')}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div><span className="text-2xl font-bold text-primary">{visa.price}</span><span className="text-sm text-muted-foreground mr-1">ر.س</span></div>
                            <Badge variant="outline" className="capitalize">{visa.entry_type === 'single' ? t(cardLabels, 'single_entry', 'دخول واحد', 'Single Entry') : t(cardLabels, 'multiple_entry', 'دخول متعدد', 'Multiple Entry')}</Badge>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0 gap-2">
                          <Button variant="outline" className="flex-1" asChild><Link to={`/visa/${visa.id}`}>{t(cardLabels, 'details_btn', 'التفاصيل', 'Details')}</Link></Button>
                          <Button className="flex-1" asChild><Link to={`/visa/${visa.id}`}>{t(cardLabels, 'apply_btn', 'قدّم الآن', 'Apply Now')}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/50">
        <div className="container-section">
          <h2 className="text-2xl font-bold mb-6">{t(filters, 'browse_country', 'تصفح حسب الدولة', 'Browse by Country')}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {countries.map((country) => (
              <button key={country.id} onClick={() => setSelectedCountry(country.code)} className={`flex items-center gap-3 rounded-lg border p-3 transition-all hover:border-primary hover:shadow-sm ${selectedCountry === country.code ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                <img src={country.flag_url || `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`} alt={country.name} className="h-6 w-8 rounded object-cover shadow-sm" />
                <span className="text-sm font-medium truncate">{country.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}