import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/DatePicker';
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
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { 
  SCHENGEN_INFO, 
  filterOutSchengenCountries, 
  getSchengenCountries,
  isSchengenCountry 
} from '@/lib/schengenCountries';

export default function Step2VisaDetails() {
  const { t, direction, language } = useLanguage();
  const { applicationData, updateApplicationData, goToNextStep, goToPreviousStep } = useApplication();
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [initialized, setInitialized] = useState(false);
  const [isSchengenFromUrl, setIsSchengenFromUrl] = useState(false);
  
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

  // Separate Schengen and non-Schengen countries
  const schengenCountries = useMemo(() => 
    countries ? getSchengenCountries(countries) : [], 
    [countries]
  );
  
  const nonSchengenCountries = useMemo(() => 
    countries ? filterOutSchengenCountries(countries) : [], 
    [countries]
  );

  // Check URL params for initial selection (e.g., /apply?country=SCHENGEN)
  useEffect(() => {
    if (!initialized && countries && countries.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const countryCode = urlParams.get('country');
      
      if (countryCode === 'SCHENGEN') {
        setSelectedRegion('schengen');
        setIsSchengenFromUrl(true); // Mark that user came from Schengen selection
      } else if (countryCode && !isSchengenCountry(countryCode)) {
        // Find the country by code and set it
        const country = countries.find(c => c.code === countryCode);
        if (country) {
          setSelectedRegion('');
          updateApplicationData({
            countryId: country.id,
            countryName: country.name,
          });
        }
      }
      setInitialized(true);
    }
  }, [countries, initialized, updateApplicationData]);

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

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    // Reset country selection when region changes
    updateApplicationData({
      countryId: '',
      countryName: '',
      visaTypeId: '',
      visaTypeName: '',
    });
  };

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

  const handleDateChange = (dateString: string) => {
    updateApplicationData({ travelDate: dateString ? new Date(dateString) : null });
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

  // Get countries to show based on selected region
  const countriesToShow = useMemo(() => {
    if (selectedRegion === 'schengen') {
      return schengenCountries;
    }
    return [];
  }, [selectedRegion, schengenCountries]);

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
          {/* Region/Country Selection - Hidden when user came from Schengen URL */}
          {!isSchengenFromUrl && (
            <div className="space-y-2">
              <Label>{t('form.country')}</Label>
              <Select
                value={selectedRegion || (applicationData.countryId && !isSchengenCountry(countries?.find(c => c.id === applicationData.countryId)?.code || '') ? applicationData.countryId : '')}
                onValueChange={(value) => {
                  if (value === 'schengen') {
                    handleRegionChange('schengen');
                  } else {
                    // Direct country selection
                    setSelectedRegion('');
                    handleCountryChange(value);
                  }
                }}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={direction === 'rtl' ? 'اختر الوجهة' : 'Select destination'} />
                </SelectTrigger>
                <SelectContent>
                  {/* Schengen Option */}
                  {schengenCountries.length > 0 && (
                    <SelectItem value="schengen">
                      <div className="flex items-center gap-2">
                        <img 
                          src={SCHENGEN_INFO.flag_url} 
                          alt="EU" 
                          className="w-5 h-4 object-cover rounded"
                        />
                        <span>{SCHENGEN_INFO.name}</span>
                      </div>
                    </SelectItem>
                  )}
                  
                  {/* Non-Schengen Countries */}
                  {nonSchengenCountries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      <div className="flex items-center gap-2">
                        <img 
                          src={country.flag_url || `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                          alt={country.name}
                          className="w-5 h-4 object-cover rounded"
                        />
                        <span>{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Schengen Country Selection - Shows when Schengen is selected or user came from Schengen URL */}
          {selectedRegion === 'schengen' && (
            <div className="space-y-2">
              <Label>{direction === 'rtl' ? 'اختر الدولة من شنغن' : 'Select Schengen country'}</Label>
              <Select
                value={applicationData.countryId}
                onValueChange={handleCountryChange}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={direction === 'rtl' ? 'اختر الدولة' : 'Select country'} />
                </SelectTrigger>
                <SelectContent>
                  {schengenCountries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      <div className="flex items-center gap-2">
                        <img 
                          src={country.flag_url || `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                          alt={country.name}
                          className="w-5 h-4 object-cover rounded"
                        />
                        <span>{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
            <DatePicker
              value={applicationData.travelDate}
              onChange={handleDateChange}
              placeholder={direction === 'rtl' ? 'اختر تاريخ السفر' : 'Pick a travel date'}
              isRTL={direction === 'rtl'}
              minDate={new Date()}
            />
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
