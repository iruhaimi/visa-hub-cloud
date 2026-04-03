import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, CheckCircle2 } from 'lucide-react';
import SARSymbol from '@/components/ui/SARSymbol';
import { useSiteSection } from '@/hooks/useSiteContent';

interface PriceSummaryCardProps {
  className?: string;
  showDetails?: boolean;
}

export default function PriceSummaryCard({ className, showDetails = true }: PriceSummaryCardProps) {
  const { t, direction } = useLanguage();
  const { applicationData, calculateTotal } = useApplication();
  const { serviceTotal, governmentTotal, grandTotal, breakdown, govBreakdown } = calculateTotal();
  
  const { travelers, visaFeesIncluded, visaTypeName, countryName, govFeeAdult, govFeeChild, govFeeInfant } = applicationData;
  
  // Fetch dynamic texts from site_content
  const { data: orderSummaryContent } = useSiteSection('order_summary', 'service_fees');
  const content = orderSummaryContent as Record<string, string> | null;
  
  const isRTL = direction === 'rtl';
  
  // Dynamic labels with fallbacks
  const serviceFeeLabel = isRTL 
    ? (content?.title_ar || 'رسوم الخدمة')
    : (content?.title_en || 'Service Fees');
  
  const serviceFeeNote = isRTL 
    ? (content?.note_ar || '')
    : (content?.note_en || '');
  
  const visaFeesLabel = isRTL
    ? (content?.visa_fees_label_ar || 'رسوم التأشيرة (تُدفع للسفارة مباشرة)')
    : (content?.visa_fees_label_en || 'Visa Fees (paid directly to embassy)');
  
  const bottomNote = visaFeesIncluded
    ? (isRTL 
        ? (content?.visa_fees_included_note_ar || 'شامل رسوم التأشيرة')
        : (content?.visa_fees_included_note_en || 'Visa fees included'))
    : (isRTL 
        ? (content?.visa_fees_separate_note_ar || 'رسوم التأشيرة ورسوم المركز تُدفع مباشرة وقت الموعد')
        : (content?.visa_fees_separate_note_en || 'Visa and center fees are paid directly at the appointment'));
  
  const totalTravelers = travelers.adults + travelers.children + travelers.infants;

  return (
    <div className={cn("bg-card border rounded-xl p-4 sm:p-5 shadow-sm", className)}>
      <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">{t('payment.summary')}</h3>
      
      {countryName && (
        <div className="mb-3 sm:mb-4 p-3 bg-primary/5 rounded-lg">
          <div className="text-xs sm:text-sm text-muted-foreground">{t('form.country')}</div>
          <div className="font-semibold text-primary text-sm sm:text-base">{countryName}</div>
          {visaTypeName && (
            <div className="text-xs sm:text-sm mt-1">{visaTypeName}</div>
          )}
        </div>
      )}
      
      {showDetails && (
        <>
          <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
            {travelers.adults > 0 && (
              <div className="flex justify-between text-xs sm:text-sm">
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
              <div className="flex justify-between text-xs sm:text-sm">
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
              <div className="flex justify-between text-xs sm:text-sm">
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
          
          <Separator className="my-3 sm:my-4" />
          
          <div className="space-y-1 mb-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">{serviceFeeLabel}</span>
              <span className="font-medium flex items-center gap-1">
                {serviceTotal.toLocaleString()}
                <SARSymbol size="xs" />
              </span>
            </div>
            {serviceFeeNote && (
              <p className="text-[10px] sm:text-xs text-muted-foreground/70 leading-relaxed">
                {serviceFeeNote}
              </p>
            )}
          </div>
          
          {!visaFeesIncluded && governmentTotal > 0 && (
            <div className="space-y-2 mb-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-xs font-medium text-muted-foreground mb-1">{visaFeesLabel}</p>
              {travelers.adults > 0 && govFeeAdult > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {isRTL ? 'بالغ' : 'Adult'} × {travelers.adults} × {govFeeAdult.toLocaleString()}
                  </span>
                  <span className="font-medium flex items-center gap-1 text-muted-foreground">
                    {govBreakdown.adults.toLocaleString()}
                    <SARSymbol size="xs" />
                  </span>
                </div>
              )}
              {travelers.children > 0 && govFeeChild > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {isRTL ? 'طفل' : 'Child'} × {travelers.children} × {govFeeChild.toLocaleString()}
                  </span>
                  <span className="font-medium flex items-center gap-1 text-muted-foreground">
                    {govBreakdown.children.toLocaleString()}
                    <SARSymbol size="xs" />
                  </span>
                </div>
              )}
              {travelers.infants > 0 && govFeeInfant > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {isRTL ? 'رضيع' : 'Infant'} × {travelers.infants} × {govFeeInfant.toLocaleString()}
                  </span>
                  <span className="font-medium flex items-center gap-1 text-muted-foreground">
                    {govBreakdown.infants.toLocaleString()}
                    <SARSymbol size="xs" />
                  </span>
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">{isRTL ? 'إجمالي الرسوم الحكومية' : 'Total Gov. Fees'}</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  {governmentTotal.toLocaleString()}
                  <SARSymbol size="xs" />
                </span>
              </div>
            </div>
          )}
        </>
      )}
      
      <Separator className="my-3 sm:my-4" />
      
      <div className="flex justify-between items-center">
        <span className="font-bold text-base sm:text-lg">{t('pricing.total')}</span>
        <span className="font-bold text-lg sm:text-xl text-primary flex items-center gap-1">
          {grandTotal.toLocaleString()}
          <SARSymbol size="md" className="text-primary" />
        </span>
      </div>
      
      <div className="mt-3 sm:mt-4">
        {visaFeesIncluded ? (
          <Badge variant="secondary" className="w-full justify-center py-1.5 sm:py-2 text-xs sm:text-sm bg-accent/20 text-accent-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 me-1.5 sm:me-2" />
            {bottomNote}
          </Badge>
        ) : (
          <Badge variant="secondary" className="w-full justify-center py-1.5 sm:py-2 text-xs sm:text-sm bg-warning/20 text-warning-foreground">
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 me-1.5 sm:me-2" />
            {bottomNote}
          </Badge>
        )}
      </div>
      
      {totalTravelers > 0 && (
        <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-muted-foreground">
          {direction === 'rtl' 
            ? `${totalTravelers} مسافر`
            : `${totalTravelers} traveler${totalTravelers > 1 ? 's' : ''}`
          }
        </div>
      )}
    </div>
  );
}
