import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, CheckCircle2 } from 'lucide-react';
import SARSymbol from '@/components/ui/SARSymbol';

interface PriceSummaryCardProps {
  className?: string;
  showDetails?: boolean;
}

export default function PriceSummaryCard({ className, showDetails = true }: PriceSummaryCardProps) {
  const { t, direction } = useLanguage();
  const { applicationData, calculateTotal } = useApplication();
  const { serviceTotal, governmentTotal, grandTotal, breakdown } = calculateTotal();
  
  const { travelers, visaFeesIncluded, visaTypeName, countryName } = applicationData;
  
  const totalTravelers = travelers.adults + travelers.children + travelers.infants;

  return (
    <div className={cn("bg-card border rounded-xl p-5 shadow-sm", className)}>
      <h3 className="font-bold text-lg mb-4">{t('payment.summary')}</h3>
      
      {countryName && (
        <div className="mb-4 p-3 bg-primary/5 rounded-lg">
          <div className="text-sm text-muted-foreground">{t('form.country')}</div>
          <div className="font-semibold text-primary">{countryName}</div>
          {visaTypeName && (
            <div className="text-sm mt-1">{visaTypeName}</div>
          )}
        </div>
      )}
      
      {showDetails && (
        <>
          <div className="space-y-3 mb-4">
            {travelers.adults > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('pricing.adult')} × {travelers.adults}
                </span>
                <span className="font-medium flex items-center gap-1">
                  {breakdown.adults.toLocaleString()}
                  <SARSymbol size="xs" />
                </span>
              </div>
            )}
            {travelers.children > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('pricing.child')} × {travelers.children}
                </span>
                <span className="font-medium flex items-center gap-1">
                  {breakdown.children.toLocaleString()}
                  <SARSymbol size="xs" />
                </span>
              </div>
            )}
            {travelers.infants > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('pricing.infant')} × {travelers.infants}
                </span>
                <span className="font-medium flex items-center gap-1">
                  {breakdown.infants.toLocaleString()}
                  <SARSymbol size="xs" />
                </span>
              </div>
            )}
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {direction === 'rtl' ? 'رسوم الخدمة' : 'Service Fees'}
            </span>
            <span className="font-medium flex items-center gap-1">
              {serviceTotal.toLocaleString()}
              <SARSymbol size="xs" />
            </span>
          </div>
          
          {!visaFeesIncluded && governmentTotal > 0 && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {direction === 'rtl' ? 'رسوم التأشيرة (تقديرية)' : 'Visa Fees (estimated)'}
              </span>
              <span className="font-medium flex items-center gap-1">
                {governmentTotal.toLocaleString()}
                <SARSymbol size="xs" />
              </span>
            </div>
          )}
        </>
      )}
      
      <Separator className="my-4" />
      
      <div className="flex justify-between items-center">
        <span className="font-bold text-lg">{t('pricing.total')}</span>
        <span className="font-bold text-xl text-primary flex items-center gap-1">
          {grandTotal.toLocaleString()}
          <SARSymbol size="md" className="text-primary" />
        </span>
      </div>
      
      <div className="mt-4">
        {visaFeesIncluded ? (
          <Badge variant="secondary" className="w-full justify-center py-2 bg-accent/20 text-accent-foreground">
            <CheckCircle2 className="w-4 h-4 me-2" />
            {t('pricing.visaFeesIncluded')}
          </Badge>
        ) : (
          <Badge variant="secondary" className="w-full justify-center py-2 bg-warning/20 text-warning-foreground">
            <Info className="w-4 h-4 me-2" />
            {t('pricing.visaFeesNotIncluded')}
          </Badge>
        )}
      </div>
      
      {totalTravelers > 0 && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {direction === 'rtl' 
            ? `${totalTravelers} مسافر`
            : `${totalTravelers} traveler${totalTravelers > 1 ? 's' : ''}`
          }
        </div>
      )}
    </div>
  );
}
