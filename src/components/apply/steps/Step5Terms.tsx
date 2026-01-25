import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, ArrowRight, FileText, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Step5Terms() {
  const { t, direction } = useLanguage();
  const { applicationData, updateApplicationData, goToNextStep, goToPreviousStep } = useApplication();
  
  const ArrowNextIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const ArrowPrevIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  const termsContent = direction === 'rtl' ? {
    title: 'الشروط والأحكام',
    sections: [
      {
        title: '1. الخدمات المقدمة',
        content: 'تقدم الشركة خدمات مساعدة في تجهيز وتقديم طلبات التأشيرات. نحن وسطاء ولسنا الجهة المانحة للتأشيرة. القرار النهائي يعود للسفارة أو القنصلية المختصة.',
      },
      {
        title: '2. الرسوم والمدفوعات',
        content: 'الرسوم تشمل رسوم خدماتنا فقط ما لم يُذكر خلاف ذلك. رسوم التأشيرة الحكومية قد تكون منفصلة وتُدفع مباشرة للجهة المختصة. جميع الرسوم غير قابلة للاسترداد في حال رفض التأشيرة.',
      },
      {
        title: '3. مسؤولية العميل',
        content: 'يتعهد العميل بتقديم معلومات صحيحة ودقيقة. أي معلومات خاطئة قد تؤدي لرفض الطلب دون استرداد الرسوم. العميل مسؤول عن مراجعة جميع البيانات قبل التقديم.',
      },
      {
        title: '4. مدة المعالجة',
        content: 'مدة المعالجة المذكورة تقديرية وتعتمد على السفارة/القنصلية. الشركة غير مسؤولة عن التأخير الناتج عن الجهات الرسمية أو ظروف خارجة عن السيطرة.',
      },
      {
        title: '5. حماية البيانات',
        content: 'نحن ملتزمون بحماية بياناتك الشخصية وفقاً لسياسة الخصوصية. لن نشارك بياناتك مع أطراف ثالثة إلا للغرض المطلوب من إجراءات التأشيرة.',
      },
      {
        title: '6. إلغاء الطلب',
        content: 'يمكن إلغاء الطلب قبل البدء في المعالجة مع خصم رسوم إدارية. بعد بدء المعالجة، لا يمكن استرداد الرسوم المدفوعة.',
      },
    ],
  } : {
    title: 'Terms and Conditions',
    sections: [
      {
        title: '1. Services Provided',
        content: 'The company provides assistance services in preparing and submitting visa applications. We are intermediaries and not the visa-issuing authority. The final decision rests with the relevant embassy or consulate.',
      },
      {
        title: '2. Fees and Payments',
        content: 'Fees include our service charges only unless otherwise stated. Government visa fees may be separate and paid directly to the relevant authority. All fees are non-refundable in case of visa rejection.',
      },
      {
        title: '3. Client Responsibility',
        content: 'The client undertakes to provide accurate and correct information. Any false information may result in application rejection without fee refund. The client is responsible for reviewing all data before submission.',
      },
      {
        title: '4. Processing Time',
        content: 'The processing time mentioned is estimated and depends on the embassy/consulate. The company is not responsible for delays caused by official authorities or circumstances beyond our control.',
      },
      {
        title: '5. Data Protection',
        content: 'We are committed to protecting your personal data in accordance with our Privacy Policy. We will not share your data with third parties except for the purpose required for visa procedures.',
      },
      {
        title: '6. Cancellation',
        content: 'The application can be cancelled before processing begins with an administrative fee deduction. After processing begins, paid fees cannot be refunded.',
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">{t('wizard.step5')}</h2>
        <p className="text-muted-foreground mt-2">
          {direction === 'rtl' 
            ? 'يرجى قراءة الشروط والأحكام والموافقة عليها' 
            : 'Please read and agree to the terms and conditions'}
        </p>
      </div>

      {/* Terms Content */}
      <div className="border rounded-lg bg-card">
        <div className="p-4 border-b flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">{termsContent.title}</h3>
        </div>
        
        <ScrollArea className="h-[400px]">
          <div className="p-6 space-y-6">
            {termsContent.sections.map((section, index) => (
              <div key={index}>
                <h4 className="font-semibold mb-2">{section.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Links to full policies */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Link 
          to="/terms" 
          target="_blank"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          {direction === 'rtl' ? 'الشروط والأحكام الكاملة' : 'Full Terms & Conditions'}
          <ExternalLink className="w-3 h-3" />
        </Link>
        <Link 
          to="/privacy" 
          target="_blank"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          {direction === 'rtl' ? 'سياسة الخصوصية' : 'Privacy Policy'}
          <ExternalLink className="w-3 h-3" />
        </Link>
        <Link 
          to="/refund" 
          target="_blank"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          {direction === 'rtl' ? 'سياسة الاسترجاع' : 'Refund Policy'}
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Agreement Checkbox */}
      <div 
        className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
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
          <Label htmlFor="terms" className="cursor-pointer leading-relaxed">
            {direction === 'rtl' 
              ? 'أقر بأنني قرأت وأوافق على الشروط والأحكام وسياسة الخصوصية وسياسة الاسترجاع'
              : 'I confirm that I have read and agree to the Terms and Conditions, Privacy Policy, and Refund Policy'
            }
          </Label>
        </div>
      </div>

      {!applicationData.termsAccepted && (
        <p className="text-sm text-amber-600 text-center">
          {t('validation.agreeTerms')}
        </p>
      )}

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
          disabled={!applicationData.termsAccepted}
        >
          {direction === 'rtl' ? 'الانتقال للدفع' : 'Proceed to Payment'}
          <ArrowNextIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
