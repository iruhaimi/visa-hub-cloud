import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, CheckCircle2 } from 'lucide-react';

interface PriceSummaryCardProps {
  className?: string;
  showDetails?: boolean;
}

export default function PriceSummaryCard({ className, showDetails = true }: PriceSummaryCardProps) {
  const { t, direction } = useLanguage();
  const { applicationData, calculateTotal } = useApplication();
  const { serviceTotal, governmentTotal, grandTotal, breakdown } = calculateTotal();
  
  const { travelers, visaFeesIncluded, visaTypeName, countryName } = applicationData;
  const currency = direction === 'rtl' ? 'ر.س' : 'SAR';
  
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
                <span className="font-medium">{breakdown.adults.toLocaleString()} {currency}</span>
              </div>
            )}
            {travelers.children > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('pricing.child')} × {travelers.children}
                </span>
                <span className="font-medium">{breakdown.children.toLocaleString()} {currency}</span>
              </div>
            )}
            {travelers.infants > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('pricing.infant')} × {travelers.infants}
                </span>
                <span className="font-medium">{breakdown.infants.toLocaleString()} {currency}</span>
              </div>
            )}
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {direction === 'rtl' ? 'رسوم الخدمة' : 'Service Fees'}
            </span>
            <span className="font-medium">{serviceTotal.toLocaleString()} {currency}</span>
          </div>
          
          {!visaFeesIncluded && governmentTotal > 0 && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {direction === 'rtl' ? 'رسوم التأشيرة (تقديرية)' : 'Visa Fees (estimated)'}
              </span>
              <span className="font-medium">{governmentTotal.toLocaleString()} {currency}</span>
            </div>
          )}
        </>
      )}
      
      <Separator className="my-4" />
      
      <div className="flex justify-between items-center">
        <span className="font-bold text-lg">{t('pricing.total')}</span>
        <span className="font-bold text-xl text-primary">{grandTotal.toLocaleString()} {currency}</span>
      </div>
      
      <div className="mt-4">
        {visaFeesIncluded ? (
          <Badge variant="secondary" className="w-full justify-center py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4 me-2" />
            {t('pricing.visaFeesIncluded')}
          </Badge>
        ) : (
          <Badge variant="secondary" className="w-full justify-center py-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
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
