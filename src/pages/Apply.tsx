import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApplicationProvider, useApplication } from '@/contexts/ApplicationContext';
import { supabase } from '@/integrations/supabase/client';
import WizardStepper from '@/components/apply/WizardStepper';
import Step1BasicInfo from '@/components/apply/steps/Step1BasicInfo';
import Step2VisaDetails from '@/components/apply/steps/Step2VisaDetails';
import Step3Requirements from '@/components/apply/steps/Step3Requirements';
import Step4Documents from '@/components/apply/steps/Step4Documents';
import Step5Terms from '@/components/apply/steps/Step5Terms';
import Step6Payment from '@/components/apply/steps/Step6Payment';
import { Skeleton } from '@/components/ui/skeleton';

function ApplyContent() {
  const { countryCode } = useParams();
  const [searchParams] = useSearchParams();
  const visaTypeId = searchParams.get('visa');
  const { direction } = useLanguage();
  const { currentStep, setCurrentStep, updateApplicationData } = useApplication();

  // Pre-fill country if coming from country page
  const { data: country, isLoading: countryLoading } = useQuery({
    queryKey: ['country-prefill', countryCode],
    queryFn: async () => {
      if (!countryCode) return null;
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('code', countryCode.toUpperCase())
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!countryCode,
  });

  // Pre-fill visa type if provided
  const { data: visaType, isLoading: visaLoading } = useQuery({
    queryKey: ['visa-prefill', visaTypeId],
    queryFn: async () => {
      if (!visaTypeId) return null;
      const { data, error } = await supabase
        .from('visa_types')
        .select('*, countries(*)')
        .eq('id', visaTypeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!visaTypeId,
  });

  // Update application data when country/visa is loaded
  useEffect(() => {
    if (country) {
      updateApplicationData({
        countryId: country.id,
        countryName: country.name,
      });
    }
  }, [country, updateApplicationData]);

  useEffect(() => {
    if (visaType) {
      const basePrice = Number(visaType.price);
      updateApplicationData({
        countryId: visaType.country_id,
        countryName: visaType.countries?.name || '',
        visaTypeId: visaType.id,
        visaTypeName: visaType.name,
        adultPrice: basePrice,
        childPrice: Math.round(basePrice * 0.75),
        infantPrice: Math.round(basePrice * 0.25),
      });
    }
  }, [visaType, updateApplicationData]);

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInfo />;
      case 2:
        return <Step2VisaDetails />;
      case 3:
        return <Step3Requirements />;
      case 4:
        return <Step4Documents />;
      case 5:
        return <Step5Terms />;
      case 6:
        return <Step6Payment />;
      default:
        return <Step1BasicInfo />;
    }
  };

  if (countryLoading || visaLoading) {
    return (
      <div className="container-section py-8">
        <Skeleton className="h-20 w-full mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header - More compact on mobile */}
      <div className="bg-gradient-to-b from-primary/10 to-transparent py-4 sm:py-8">
        <div className="container-section px-4 sm:px-6">
          <h1 className="text-xl sm:text-3xl font-bold text-center">
            {direction === 'rtl' ? 'تقديم طلب التأشيرة' : 'Visa Application'}
          </h1>
          {country && (
            <p className="text-center text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
              {direction === 'rtl' ? `التأشيرة إلى ${country.name}` : `Visa to ${country.name}`}
            </p>
          )}
        </div>
      </div>

      {/* Wizard Stepper */}
      <div className="container-section px-4 sm:px-6">
        <WizardStepper 
          currentStep={currentStep} 
          totalSteps={6} 
          onStepClick={handleStepClick}
        />
      </div>

      {/* Step Content */}
      <div className="container-section px-4 sm:px-6 py-4 sm:py-8 pb-24 sm:pb-8">
        <div className="max-w-4xl mx-auto bg-card rounded-xl shadow-sm border p-4 sm:p-6 md:p-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

export default function Apply() {
  return (
    <ApplicationProvider>
      <ApplyContent />
    </ApplicationProvider>
  );
}
