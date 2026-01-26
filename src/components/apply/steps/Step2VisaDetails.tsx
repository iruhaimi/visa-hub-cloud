import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import TravelerCounter from '../TravelerCounter';
import PriceSummaryCard from '../PriceSummaryCard';
import SARSymbol from '@/components/ui/SARSymbol';
import { CalendarIcon, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Step2VisaDetails() {
  const { t, direction, language } = useLanguage();
  const { applicationData, updateApplicationData, goToNextStep, goToPreviousStep } = useApplication();
  const [dateOpen, setDateOpen] = useState(false);
  
  const ArrowNextIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const ArrowPrevIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  // Fetch countries
  const { data: countries } = useQuery({
    queryKey: ['countries-apply'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch visa types for selected country
  const { data: visaTypes, isLoading: visaTypesLoading } = useQuery({
    queryKey: ['visa-types-apply', applicationData.countryId],
    queryFn: async () => {
      if (!applicationData.countryId) return [];
      const { data, error } = await supabase
        .from('visa_types')
        .select('*')
        .eq('country_id', applicationData.countryId)
        .eq('is_active', true)
        .order('price');
      if (error) throw error;
      return data;
    },
    enabled: !!applicationData.countryId,
  });

  // Update prices when visa type changes
  useEffect(() => {
    if (applicationData.visaTypeId && visaTypes) {
      const selectedVisa = visaTypes.find(v => v.id === applicationData.visaTypeId);
      if (selectedVisa) {
        // Calculate prices (example: child 75%, infant 25%)
        const basePrice = Number(selectedVisa.price);
        updateApplicationData({
          visaTypeName: selectedVisa.name,
          adultPrice: basePrice,
          childPrice: Math.round(basePrice * 0.75),
          infantPrice: Math.round(basePrice * 0.25),
          visaFeesIncluded: true, // Can be dynamic based on visa type
          governmentFees: Math.round(basePrice * 0.3), // Example
        });
      }
    }
  }, [applicationData.visaTypeId, visaTypes, updateApplicationData]);

  const handleCountryChange = (countryId: string) => {
    const country = countries?.find(c => c.id === countryId);
    updateApplicationData({
      countryId,
      countryName: country?.name || '',
      visaTypeId: '',
      visaTypeName: '',
    });
  };

  const handleVisaTypeChange = (visaTypeId: string) => {
    updateApplicationData({ visaTypeId });
  };

  const handleDateSelect = (date: Date | undefined) => {
    updateApplicationData({ travelDate: date || null });
    setDateOpen(false);
  };

  const updateTravelers = (type: 'adults' | 'children' | 'infants', value: number) => {
    updateApplicationData({
      travelers: {
        ...applicationData.travelers,
        [type]: value,
      },
    });
  };

  const canProceed = applicationData.visaTypeId && applicationData.travelDate && 
    (applicationData.travelers.adults + applicationData.travelers.children + applicationData.travelers.infants) > 0;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">{t('wizard.step2')}</h2>
        <p className="text-muted-foreground mt-2">
          {direction === 'rtl' 
            ? 'حدد نوع التأشيرة وتاريخ السفر وعدد المسافرين' 
            : 'Select visa type, travel date and number of travelers'}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Country Selection */}
          <div className="space-y-2">
            <Label>{t('form.country')}</Label>
            <Select
              value={applicationData.countryId}
              onValueChange={handleCountryChange}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder={direction === 'rtl' ? 'اختر الدولة' : 'Select country'} />
              </SelectTrigger>
              <SelectContent>
                {countries?.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.flag_url && <span className="me-2">{country.flag_url}</span>}
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visa Type Selection */}
          <div className="space-y-2">
            <Label>{t('form.visaType')}</Label>
            <Select
              value={applicationData.visaTypeId}
              onValueChange={handleVisaTypeChange}
              disabled={!applicationData.countryId || visaTypesLoading}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder={
                  visaTypesLoading 
                    ? (direction === 'rtl' ? 'جاري التحميل...' : 'Loading...') 
                    : (direction === 'rtl' ? 'اختر نوع التأشيرة' : 'Select visa type')
                } />
              </SelectTrigger>
              <SelectContent>
                {visaTypes?.map((visa) => (
                  <SelectItem key={visa.id} value={visa.id}>
                    <div className="flex justify-between items-center w-full">
                      <span>{visa.name}</span>
                      <span className="text-primary font-medium ms-4 flex items-center gap-1">
                        {Number(visa.price).toLocaleString()}
                        <SARSymbol size="xs" className="text-primary" />
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Travel Date */}
          <div className="space-y-2">
            <Label>{t('form.travelDate')}</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-start font-normal",
                    !applicationData.travelDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="me-2 h-4 w-4" />
                  {applicationData.travelDate ? (
                    format(applicationData.travelDate, "PPP", { locale: language === 'ar' ? ar : enUS })
                  ) : (
                    direction === 'rtl' ? 'اختر تاريخ السفر' : 'Pick a travel date'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={applicationData.travelDate || undefined}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Traveler Counters */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">{t('form.travelers')}</Label>
            
            <TravelerCounter
              label={t('form.adults')}
              description={t('pricing.adult')}
              value={applicationData.travelers.adults}
              price={applicationData.adultPrice}
              min={1}
              onChange={(val) => updateTravelers('adults', val)}
            />
            
            <TravelerCounter
              label={t('form.children')}
              description={t('pricing.child')}
              value={applicationData.travelers.children}
              price={applicationData.childPrice}
              onChange={(val) => updateTravelers('children', val)}
            />
            
            <TravelerCounter
              label={t('form.infants')}
              description={t('pricing.infant')}
              value={applicationData.travelers.infants}
              price={applicationData.infantPrice}
              onChange={(val) => updateTravelers('infants', val)}
            />
          </div>
        </div>

        {/* Price Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <PriceSummaryCard />
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 pt-6">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1 h-12 gap-2"
          onClick={goToPreviousStep}
        >
          <ArrowPrevIcon className="w-4 h-4" />
          {t('wizard.previous')}
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1 h-12 gap-2"
          onClick={goToNextStep}
          disabled={!canProceed}
        >
          {t('wizard.next')}
          <ArrowNextIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
