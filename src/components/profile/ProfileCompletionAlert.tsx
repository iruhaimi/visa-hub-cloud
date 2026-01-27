import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ProfileCompletionAlertProps {
  missingFields: string[];
  isRTL: boolean;
}

export const ProfileCompletionAlert = ({ missingFields, isRTL }: ProfileCompletionAlertProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || missingFields.length === 0) {
    return null;
  }

  const fieldLabels: Record<string, { ar: string; en: string }> = {
    full_name: { ar: 'الاسم الكامل', en: 'Full Name' },
    phone: { ar: 'رقم الهاتف', en: 'Phone Number' },
    date_of_birth: { ar: 'تاريخ الميلاد', en: 'Date of Birth' },
    nationality: { ar: 'الجنسية', en: 'Nationality' },
    passport_number: { ar: 'رقم جواز السفر', en: 'Passport Number' },
    passport_expiry: { ar: 'تاريخ انتهاء الجواز', en: 'Passport Expiry' },
    address: { ar: 'العنوان', en: 'Address' },
    city: { ar: 'المدينة', en: 'City' },
    country: { ar: 'الدولة', en: 'Country' },
  };

  const getFieldLabel = (field: string) => {
    return fieldLabels[field]?.[isRTL ? 'ar' : 'en'] || field;
  };

  const completionPercentage = Math.round(((9 - missingFields.length) / 9) * 100);

  return (
    <Alert variant="default" className="mb-6 border-warning/50 bg-warning/10">
      <AlertCircle className="h-5 w-5 text-warning" />
      <div className="flex-1">
        <AlertTitle className="text-warning-foreground flex items-center justify-between">
          <span>
            {isRTL ? 'أكمل ملفك الشخصي' : 'Complete Your Profile'}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mt-1 -mr-2 hover:bg-warning/20"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4 text-warning" />
          </Button>
        </AlertTitle>
        <AlertDescription className="text-muted-foreground">
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-warning transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-sm font-medium">{completionPercentage}%</span>
            </div>
            <p className="text-sm">
              {isRTL 
                ? 'يرجى استكمال البيانات التالية لتسهيل عملية التقديم على التأشيرة:'
                : 'Please complete the following fields to facilitate your visa application:'
              }
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {missingFields.slice(0, 5).map((field) => (
                <span
                  key={field}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-warning/20 text-foreground"
                >
                  {getFieldLabel(field)}
                </span>
              ))}
              {missingFields.length > 5 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-warning/20 text-foreground">
                  +{missingFields.length - 5} {isRTL ? 'حقول أخرى' : 'more fields'}
                </span>
              )}
            </div>
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
};
