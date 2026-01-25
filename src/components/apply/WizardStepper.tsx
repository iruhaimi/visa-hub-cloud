import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface WizardStepperProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

export default function WizardStepper({ currentStep, totalSteps, onStepClick }: WizardStepperProps) {
  const { t, direction } = useLanguage();
  
  const steps = [
    { number: 1, label: t('wizard.step1') },
    { number: 2, label: t('wizard.step2') },
    { number: 3, label: t('wizard.step3') },
    { number: 4, label: t('wizard.step4') },
    { number: 5, label: t('wizard.step5') },
    { number: 6, label: t('wizard.step6') },
  ];

  return (
    <div className="w-full py-6">
      {/* Desktop Stepper */}
      <div className="hidden lg:flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <button
                onClick={() => onStepClick?.(step.number)}
                disabled={step.number > currentStep}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                  step.number < currentStep && "bg-primary text-primary-foreground cursor-pointer",
                  step.number === currentStep && "bg-primary text-primary-foreground ring-4 ring-primary/30",
                  step.number > currentStep && "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {step.number < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </button>
              <span className={cn(
                "mt-2 text-xs font-medium text-center max-w-[80px]",
                step.number === currentStep ? "text-primary" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-2",
                step.number < currentStep ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Mobile Stepper */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            {direction === 'rtl' ? `الخطوة ${currentStep} من ${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}
          </span>
          <span className="text-sm font-semibold text-primary">
            {steps.find(s => s.number === currentStep)?.label}
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step) => (
            <div
              key={step.number}
              className={cn(
                "w-2 h-2 rounded-full",
                step.number <= currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
