import { useState } from 'react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import SARSymbol from '@/components/ui/SARSymbol';
import { 
  ArrowLeft, 
  ArrowRight, 
  CreditCard, 
  Wallet, 
  Building2,
  Shield,
  Lock,
  CheckCircle2,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const paymentMethods = [
  { 
    id: 'card', 
    label: { ar: 'بطاقة ائتمانية', en: 'Credit Card' },
    description: { ar: 'Visa, Mastercard, مدى', en: 'Visa, Mastercard, Mada' },
    icon: CreditCard,
  },
  { 
    id: 'apple_pay', 
    label: { ar: 'Apple Pay', en: 'Apple Pay' },
    description: { ar: 'ادفع بسهولة', en: 'Pay easily' },
    icon: Wallet,
  },
  { 
    id: 'bank_transfer', 
    label: { ar: 'تحويل بنكي', en: 'Bank Transfer' },
    description: { ar: 'تحويل مباشر للحساب', en: 'Direct bank transfer' },
    icon: Building2,
  },
];

export default function Step6Payment() {
  const { t, direction, language } = useLanguage();
  const { applicationData, updateApplicationData, calculateTotal, goToPreviousStep, resetApplication } = useApplication();
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { serviceTotal, governmentTotal, grandTotal, breakdown } = calculateTotal();
  
  const ArrowPrevIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  const handlePayment = async () => {
    if (!applicationData.paymentMethod) {
      toast({
        title: direction === 'rtl' ? 'خطأ' : 'Error',
        description: t('payment.selectMethod'),
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Generate application number
    const appNumber = `VISA-${Date.now().toString(36).toUpperCase()}`;
    
    setIsProcessing(false);
    
    // Navigate to success page
    navigate(`/payment-success?app=${appNumber}`);
    
    // Reset application
    setTimeout(() => resetApplication(), 1000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">{t('wizard.step6')}</h2>
        <p className="text-muted-foreground mt-2">
          {direction === 'rtl' 
            ? 'راجع طلبك وأكمل عملية الدفع' 
            : 'Review your application and complete payment'}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Order Summary */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('payment.summary')}
          </h3>
          
          {/* Application Details */}
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Customer Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('form.fullName')}:</span>
                  <span className="font-medium">{applicationData.fullName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('form.email')}:</span>
                  <span className="font-medium" dir="ltr">{applicationData.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('form.phone')}:</span>
                  <span className="font-medium" dir="ltr">{applicationData.countryCode} {applicationData.phone}</span>
                </div>
              </div>
              
              <Separator />
              
              {/* Visa Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('form.country')}:</span>
                  <span className="font-medium">{applicationData.countryName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('form.visaType')}:</span>
                  <span className="font-medium">{applicationData.visaTypeName}</span>
                </div>
                {applicationData.travelDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('form.travelDate')}:</span>
                    <span className="font-medium">
                      {format(applicationData.travelDate, 'PPP', { locale: language === 'ar' ? ar : enUS })}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('form.travelers')}:</span>
                  <span className="font-medium">
                    {applicationData.travelers.adults} {t('form.adults')}
                    {applicationData.travelers.children > 0 && `, ${applicationData.travelers.children} ${t('form.children')}`}
                    {applicationData.travelers.infants > 0 && `, ${applicationData.travelers.infants} ${t('form.infants')}`}
                  </span>
                </div>
              </div>
              
              <Separator />
              
              {/* Price Breakdown */}
              <div className="space-y-2">
                {applicationData.travelers.adults > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('pricing.adult')} × {applicationData.travelers.adults}
                    </span>
                    <span className="flex items-center gap-1">
                      {breakdown.adults.toLocaleString()}
                      <SARSymbol size="xs" />
                    </span>
                  </div>
                )}
                {applicationData.travelers.children > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('pricing.child')} × {applicationData.travelers.children}
                    </span>
                    <span className="flex items-center gap-1">
                      {breakdown.children.toLocaleString()}
                      <SARSymbol size="xs" />
                    </span>
                  </div>
                )}
                {applicationData.travelers.infants > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('pricing.infant')} × {applicationData.travelers.infants}
                    </span>
                    <span className="flex items-center gap-1">
                      {breakdown.infants.toLocaleString()}
                      <SARSymbol size="xs" />
                    </span>
                  </div>
                )}
                
                <Separator className="my-2" />
                
                <div className="flex justify-between text-sm">
                  <span>{direction === 'rtl' ? 'رسوم الخدمة' : 'Service Fees'}</span>
                  <span className="flex items-center gap-1">
                    {serviceTotal.toLocaleString()}
                    <SARSymbol size="xs" />
                  </span>
                </div>
                
                {!applicationData.visaFeesIncluded && governmentTotal > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{direction === 'rtl' ? 'رسوم التأشيرة (تُدفع لاحقاً)' : 'Visa Fees (to be paid later)'}</span>
                    <span className="flex items-center gap-1">
                      {governmentTotal.toLocaleString()}
                      <SARSymbol size="xs" />
                    </span>
                  </div>
                )}
                
                <Separator className="my-2" />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>{t('pricing.total')}</span>
                  <span className="text-primary flex items-center gap-1">
                    {grandTotal.toLocaleString()}
                    <SARSymbol size="md" className="text-primary" />
                  </span>
                </div>
              </div>
              
              <Badge 
                variant="secondary" 
                className={cn(
                  "w-full justify-center py-2",
                  applicationData.visaFeesIncluded 
                    ? "bg-accent/20 text-accent-foreground" 
                    : "bg-warning/20 text-warning-foreground"
                )}
              >
                {applicationData.visaFeesIncluded 
                  ? t('pricing.visaFeesIncluded')
                  : t('pricing.visaFeesNotIncluded')
                }
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {t('payment.selectMethod')}
          </h3>
          
          <RadioGroup
            value={applicationData.paymentMethod}
            onValueChange={(value) => updateApplicationData({ paymentMethod: value })}
            className="space-y-3"
          >
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={cn(
                  "flex items-center space-x-3 rtl:space-x-reverse p-4 rounded-lg border-2 cursor-pointer transition-colors",
                  applicationData.paymentMethod === method.id 
                    ? "border-primary bg-primary/5" 
                    : "border-muted hover:border-primary/50"
                )}
                onClick={() => updateApplicationData({ paymentMethod: method.id })}
              >
                <RadioGroupItem value={method.id} id={method.id} />
                <method.icon className="w-6 h-6 text-muted-foreground" />
                <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                  <div className="font-medium">{method.label[language]}</div>
                  <div className="text-sm text-muted-foreground">{method.description[language]}</div>
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* Security Badges */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-accent" />
              <span className="font-medium text-sm">
                {direction === 'rtl' ? 'دفع آمن ومشفر' : 'Secure & Encrypted Payment'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>PCI Compliant</span>
              </div>
            </div>
          </div>

          {/* Pay Button */}
          <Button
            size="lg"
            className="w-full h-14 text-lg gap-2"
            onClick={handlePayment}
            disabled={!applicationData.paymentMethod || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {direction === 'rtl' ? 'جاري المعالجة...' : 'Processing...'}
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span className="flex items-center gap-1">
                  {t('wizard.pay')} - {grandTotal.toLocaleString()}
                  <SARSymbol size="sm" />
                </span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Back Button */}
      <div className="pt-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="gap-2"
          onClick={goToPreviousStep}
          disabled={isProcessing}
        >
          <ArrowPrevIcon className="w-4 h-4" />
          {t('wizard.previous')}
        </Button>
      </div>
    </div>
  );
}
