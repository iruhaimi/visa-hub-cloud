import { useState } from 'react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import SARSymbol from '@/components/ui/SARSymbol';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  ExternalLink,
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
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getWhatsAppUrl, openWhatsAppUrl, prepareWhatsAppWindow } from '@/lib/whatsapp';

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

export default function Step3TermsAndPayment() {
  const { t, direction, language } = useLanguage();
  const { applicationData, updateApplicationData, calculateTotal, goToPreviousStep, resetApplication, draftId } = useApplication();
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { serviceTotal, governmentTotal, grandTotal, breakdown } = calculateTotal();
  const ArrowPrevIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  const termsContent = direction === 'rtl' ? {
    title: 'الشروط والأحكام',
    sections: [
      { title: '1. الخدمات المقدمة', content: 'تقدم الشركة خدمات مساعدة في تجهيز وتقديم طلبات التأشيرات. نحن وسطاء ولسنا الجهة المانحة للتأشيرة.' },
      { title: '2. الرسوم والمدفوعات', content: 'الرسوم تشمل رسوم خدماتنا فقط ما لم يُذكر خلاف ذلك. جميع الرسوم غير قابلة للاسترداد في حال رفض التأشيرة.' },
      { title: '3. مسؤولية العميل', content: 'يتعهد العميل بتقديم معلومات صحيحة ودقيقة. أي معلومات خاطئة قد تؤدي لرفض الطلب دون استرداد الرسوم.' },
      { title: '4. مدة المعالجة', content: 'مدة المعالجة المذكورة تقديرية. الشركة غير مسؤولة عن التأخير الناتج عن الجهات الرسمية.' },
      { title: '5. حماية البيانات', content: 'نحن ملتزمون بحماية بياناتك الشخصية وفقاً لسياسة الخصوصية.' },
      { title: '6. إلغاء الطلب', content: 'يمكن إلغاء الطلب قبل البدء في المعالجة مع خصم رسوم إدارية.' },
    ],
  } : {
    title: 'Terms and Conditions',
    sections: [
      { title: '1. Services Provided', content: 'The company provides assistance services in preparing and submitting visa applications. We are intermediaries and not the visa-issuing authority.' },
      { title: '2. Fees and Payments', content: 'Fees include our service charges only unless otherwise stated. All fees are non-refundable in case of visa rejection.' },
      { title: '3. Client Responsibility', content: 'The client undertakes to provide accurate and correct information. Any false information may result in application rejection without fee refund.' },
      { title: '4. Processing Time', content: 'The processing time mentioned is estimated. The company is not responsible for delays caused by official authorities.' },
      { title: '5. Data Protection', content: 'We are committed to protecting your personal data in accordance with our Privacy Policy.' },
      { title: '6. Cancellation', content: 'The application can be cancelled before processing begins with an administrative fee deduction.' },
    ],
  };

  const handlePayment = async () => {
    if (!applicationData.paymentMethod) {
      toast({
        title: direction === 'rtl' ? 'خطأ' : 'Error',
        description: t('payment.selectMethod'),
        variant: 'destructive',
      });
      return;
    }

    if (!draftId) {
      toast({
        title: direction === 'rtl' ? 'خطأ' : 'Error',
        description: direction === 'rtl' ? 'لم يتم حفظ الطلب. يرجى المحاولة مرة أخرى.' : 'Application not saved. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: 'pending_payment' as const,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', draftId)
        .in('status', ['draft', 'pending_payment'] as const);

      if (updateError) {
        console.error('Error updating to pending_payment:', updateError);
      }

      await new Promise(resolve => setTimeout(resolve, 2500));

      const appNumber = `VISA-${Date.now().toString(36).toUpperCase()}`;

      setIsProcessing(false);
      navigate(`/payment-success?app=${appNumber}&id=${draftId}`);
      setTimeout(() => resetApplication(), 1000);
    } catch (error) {
      console.error('Error submitting application:', error);
      setIsProcessing(false);
      toast({
        title: direction === 'rtl' ? 'خطأ' : 'Error',
        description: direction === 'rtl' ? 'حدث خطأ أثناء تقديم الطلب' : 'An error occurred while submitting the application',
        variant: 'destructive',
      });
    }
  };

  const handleWhatsAppSubmit = async () => {
    if (!draftId) {
      toast({
        title: direction === 'rtl' ? 'خطأ' : 'Error',
        description: direction === 'rtl' ? 'لم يتم حفظ الطلب. يرجى المحاولة مرة أخرى.' : 'Application not saved. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    const pendingWhatsAppWindow = prepareWhatsAppWindow();
    setIsProcessing(true);

    try {
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: 'whatsapp_pending' as any,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', draftId)
        .in('status', ['draft', 'pending_payment'] as const);

      if (updateError) {
        throw updateError;
      }

      const messageParts = [
        direction === 'rtl' ? '🔹 طلب تأشيرة جديد عبر الموقع' : '🔹 New visa application from website',
        '',
        direction === 'rtl' ? `📋 رقم الطلب: ${draftId.slice(0, 8).toUpperCase()}` : `📋 Application: ${draftId.slice(0, 8).toUpperCase()}`,
        direction === 'rtl' ? `👤 الاسم: ${applicationData.fullName}` : `👤 Name: ${applicationData.fullName}`,
        direction === 'rtl' ? `📧 الإيميل: ${applicationData.email}` : `📧 Email: ${applicationData.email}`,
        direction === 'rtl' ? `📞 الجوال: ${applicationData.countryCode} ${applicationData.phone}` : `📞 Phone: ${applicationData.countryCode} ${applicationData.phone}`,
        '',
        direction === 'rtl' ? `🌍 الدولة: ${applicationData.countryName}` : `🌍 Country: ${applicationData.countryName}`,
        direction === 'rtl' ? `📄 نوع التأشيرة: ${applicationData.visaTypeName}` : `📄 Visa Type: ${applicationData.visaTypeName}`,
        direction === 'rtl'
          ? `👥 المسافرين: ${applicationData.travelers.adults} بالغ${applicationData.travelers.children > 0 ? ` - ${applicationData.travelers.children} طفل` : ''}${applicationData.travelers.infants > 0 ? ` - ${applicationData.travelers.infants} رضيع` : ''}`
          : `👥 Travelers: ${applicationData.travelers.adults} Adults${applicationData.travelers.children > 0 ? `, ${applicationData.travelers.children} Children` : ''}${applicationData.travelers.infants > 0 ? `, ${applicationData.travelers.infants} Infants` : ''}`,
        '',
        direction === 'rtl' ? `💰 المبلغ الإجمالي: ${grandTotal.toLocaleString()} ر.س` : `💰 Total: ${grandTotal.toLocaleString()} SAR`,
        '',
        direction === 'rtl' ? 'أرغب بإكمال الطلب والدفع عبر الواتساب.' : 'I would like to complete the application and payment via WhatsApp.',
      ];

      const message = messageParts.join('\n');
      const url = getWhatsAppUrl(message);

      setIsProcessing(false);

      toast({
        title: direction === 'rtl' ? '✅ تم إرسال الطلب' : '✅ Application Submitted',
        description: direction === 'rtl'
          ? 'تم حفظ طلبك وسيتواصل معك فريقنا عبر الواتساب قريباً'
          : 'Your application has been saved. Our team will contact you via WhatsApp soon.',
      });

      openWhatsAppUrl(url, pendingWhatsAppWindow);
    } catch (error) {
      pendingWhatsAppWindow?.close();
      console.error('Error submitting via WhatsApp:', error);
      setIsProcessing(false);
      toast({
        title: direction === 'rtl' ? 'خطأ' : 'Error',
        description: direction === 'rtl' ? 'حدث خطأ أثناء تقديم الطلب' : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">{t('wizard.step3')}</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          {direction === 'rtl'
            ? 'وافق على الشروط واختر طريقة إكمال طلبك'
            : 'Agree to terms and choose how to complete your application'}
        </p>
      </div>

      {/* Terms Section - Collapsible */}
      <div className="border rounded-lg bg-card">
        <div className="p-4 border-b flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">{termsContent.title}</h3>
        </div>

        <ScrollArea className="h-[200px]">
          <div className="p-4 space-y-4" dir={direction === 'rtl' ? 'rtl' : 'ltr'} style={{ textAlign: direction === 'rtl' ? 'right' : 'left' }}>
            {termsContent.sections.map((section, index) => (
              <div key={index}>
                <h4 className="font-semibold text-sm mb-1">{section.title}</h4>
                <p className="text-muted-foreground text-xs leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Links to full policies */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/terms" target="_blank" className="flex items-center gap-1 text-xs text-primary hover:underline">
          {direction === 'rtl' ? 'الشروط الكاملة' : 'Full Terms'}
          <ExternalLink className="w-3 h-3" />
        </Link>
        <Link to="/privacy" target="_blank" className="flex items-center gap-1 text-xs text-primary hover:underline">
          {direction === 'rtl' ? 'سياسة الخصوصية' : 'Privacy Policy'}
          <ExternalLink className="w-3 h-3" />
        </Link>
        <Link to="/refund" target="_blank" className="flex items-center gap-1 text-xs text-primary hover:underline">
          {direction === 'rtl' ? 'سياسة الاسترجاع' : 'Refund Policy'}
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Agreement Checkbox */}
      <div
        className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${
          applicationData.termsAccepted
            ? 'border-primary bg-primary/5'
            : 'border-muted hover:border-primary/50'
        }`}
        onClick={() => updateApplicationData({ termsAccepted: !applicationData.termsAccepted })}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={applicationData.termsAccepted}
            onCheckedChange={(checked) => updateApplicationData({ termsAccepted: checked as boolean })}
            className="mt-0.5"
          />
          <Label htmlFor="terms" className="cursor-pointer leading-relaxed text-sm">
            {direction === 'rtl'
              ? 'أقر بأنني قرأت وأوافق على الشروط والأحكام وسياسة الخصوصية وسياسة الاسترجاع'
              : 'I confirm that I have read and agree to the Terms and Conditions, Privacy Policy, and Refund Policy'}
          </Label>
        </div>
      </div>

      {!applicationData.termsAccepted && (
        <p className="text-xs text-amber-600 text-center">{t('validation.agreeTerms')}</p>
      )}

      {/* Payment & WhatsApp Section - Only show after terms accepted */}
      {applicationData.termsAccepted && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Separator />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Order Summary */}
            <div className="space-y-3 order-2 lg:order-1">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('payment.summary')}
              </h3>

              <Card>
                <CardContent className="p-4 space-y-3">
                  {/* Customer Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('form.fullName')}:</span>
                      <span className="font-medium">{applicationData.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('form.email')}:</span>
                      <span className="font-medium" dir="ltr">{applicationData.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('form.phone')}:</span>
                      <span className="font-medium" dir="ltr">{applicationData.countryCode} {applicationData.phone}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Visa Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('form.country')}:</span>
                      <span className="font-medium">{applicationData.countryName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('form.visaType')}:</span>
                      <span className="font-medium">{applicationData.visaTypeName}</span>
                    </div>
                    {applicationData.travelDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('form.travelDate')}:</span>
                        <span className="font-medium">
                          {format(applicationData.travelDate, 'PPP', { locale: language === 'ar' ? ar : enUS })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
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
                  <div className="space-y-1.5">
                    {applicationData.travelers.adults > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('pricing.adult')} × {applicationData.travelers.adults}</span>
                        <span className="flex items-center gap-1">{breakdown.adults.toLocaleString()} <SARSymbol size="xs" /></span>
                      </div>
                    )}
                    {applicationData.travelers.children > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('pricing.child')} × {applicationData.travelers.children}</span>
                        <span className="flex items-center gap-1">{breakdown.children.toLocaleString()} <SARSymbol size="xs" /></span>
                      </div>
                    )}
                    {applicationData.travelers.infants > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('pricing.infant')} × {applicationData.travelers.infants}</span>
                        <span className="flex items-center gap-1">{breakdown.infants.toLocaleString()} <SARSymbol size="xs" /></span>
                      </div>
                    )}

                    <Separator className="my-1" />

                    <div className="flex justify-between text-sm">
                      <span>{direction === 'rtl' ? 'رسوم الخدمة' : 'Service Fees'}</span>
                      <span className="flex items-center gap-1">{serviceTotal.toLocaleString()} <SARSymbol size="xs" /></span>
                    </div>

                    {!applicationData.visaFeesIncluded && governmentTotal > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground p-2 rounded-lg bg-warning/10 border border-warning/20">
                        <span>{direction === 'rtl' ? 'رسوم التأشيرة (تُدفع للسفارة)' : 'Visa Fees (paid to embassy)'}</span>
                        <span className="flex items-center gap-1">{governmentTotal.toLocaleString()} <SARSymbol size="xs" /></span>
                      </div>
                    )}

                    <Separator className="my-1" />

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
                      "w-full justify-center py-1.5",
                      applicationData.visaFeesIncluded
                        ? "bg-accent/20 text-accent-foreground"
                        : "bg-warning/20 text-warning-foreground"
                    )}
                  >
                    {applicationData.visaFeesIncluded ? t('pricing.visaFeesIncluded') : t('pricing.visaFeesNotIncluded')}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods + WhatsApp */}
            <div className="space-y-3 order-1 lg:order-2">
              <h3 className="font-bold text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                {t('payment.selectMethod')}
              </h3>

              <RadioGroup
                value={applicationData.paymentMethod}
                onValueChange={(value) => updateApplicationData({ paymentMethod: value })}
                className="space-y-2"
              >
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={cn(
                      "flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-xl border-2 cursor-pointer transition-colors",
                      applicationData.paymentMethod === method.id
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    )}
                    onClick={() => updateApplicationData({ paymentMethod: method.id })}
                  >
                    <RadioGroupItem value={method.id} id={method.id} />
                    <method.icon className="w-5 h-5 text-muted-foreground shrink-0" />
                    <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                      <div className="font-medium text-sm">{method.label[language]}</div>
                      <div className="text-xs text-muted-foreground">{method.description[language]}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {/* Security Badges */}
              <div className="p-3 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-accent" />
                  <span className="font-medium text-xs">
                    {direction === 'rtl' ? 'دفع آمن ومشفر' : 'Secure & Encrypted Payment'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>SSL Secured</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>PCI Compliant</span>
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              <Button
                size="lg"
                className="w-full h-12 text-base gap-2"
                onClick={handlePayment}
                disabled={!applicationData.paymentMethod || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{direction === 'rtl' ? 'جاري المعالجة...' : 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span className="flex items-center gap-1 text-sm">
                      {t('wizard.pay')} - {grandTotal.toLocaleString()}
                      <SARSymbol size="sm" />
                    </span>
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative py-2">
                <Separator />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                  {direction === 'rtl' ? 'أو' : 'OR'}
                </span>
              </div>

              {/* WhatsApp Option */}
              <Button
                size="lg"
                variant="outline"
                className="w-full h-12 text-base gap-2 border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                onClick={handleWhatsAppSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{direction === 'rtl' ? 'جاري الإرسال...' : 'Sending...'}</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">
                      {direction === 'rtl' ? 'أكمل عبر الواتساب' : 'Complete via WhatsApp'}
                    </span>
                  </>
                )}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                {direction === 'rtl'
                  ? 'سيتم حفظ طلبك وسيتواصل معك فريقنا لإكمال الطلب والدفع عبر الواتساب'
                  : 'Your application will be saved and our team will contact you to complete the process via WhatsApp'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="pt-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="gap-2 h-10"
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
