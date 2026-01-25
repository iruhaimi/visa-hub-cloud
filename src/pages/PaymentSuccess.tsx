import { useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle2, 
  Download, 
  Search, 
  Home, 
  Mail,
  Clock,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const applicationNumber = searchParams.get('app') || 'VISA-XXXXXX';
  const { direction } = useLanguage();

  const content = direction === 'rtl' ? {
    title: 'تم الدفع بنجاح!',
    subtitle: 'تم استلام طلبك وسيتم معالجته في أقرب وقت',
    appNumber: 'رقم طلبك هو',
    copySuccess: 'تم نسخ الرقم',
    nextSteps: 'الخطوات التالية',
    step1: 'سيتم مراجعة طلبك خلال 1-2 يوم عمل',
    step2: 'ستصلك رسالة على بريدك الإلكتروني بالتحديثات',
    step3: 'يمكنك تتبع حالة طلبك في أي وقت',
    trackBtn: 'تتبع الطلب',
    receiptBtn: 'تحميل الإيصال',
    homeBtn: 'العودة للرئيسية',
    emailSent: 'تم إرسال تأكيد على بريدك الإلكتروني',
    processingTime: 'الوقت المتوقع للمعالجة',
    days: 'يوم عمل',
  } : {
    title: 'Payment Successful!',
    subtitle: 'Your application has been received and will be processed soon',
    appNumber: 'Your application number is',
    copySuccess: 'Number copied',
    nextSteps: 'Next Steps',
    step1: 'Your application will be reviewed within 1-2 business days',
    step2: 'You will receive email updates on your application status',
    step3: 'You can track your application status anytime',
    trackBtn: 'Track Application',
    receiptBtn: 'Download Receipt',
    homeBtn: 'Back to Home',
    emailSent: 'Confirmation email sent to your address',
    processingTime: 'Expected processing time',
    days: 'business days',
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 text-center text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <CheckCircle2 className="w-20 h-20 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">{content.title}</h1>
            <p className="text-green-100">{content.subtitle}</p>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Application Number */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">{content.appNumber}</p>
              <p className="text-2xl font-mono font-bold text-primary tracking-wider">
                {applicationNumber}
              </p>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail className="w-5 h-5 text-primary" />
                <div className="text-sm">
                  <div className="text-muted-foreground">{content.emailSent}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="w-5 h-5 text-primary" />
                <div className="text-sm">
                  <div className="font-medium">5-7 {content.days}</div>
                  <div className="text-muted-foreground text-xs">{content.processingTime}</div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {content.nextSteps}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                  {content.step1}
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                  {content.step2}
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                  {content.step3}
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button asChild className="w-full h-12 gap-2">
                <Link to={`/track?app=${applicationNumber}`}>
                  <Search className="w-4 h-4" />
                  {content.trackBtn}
                </Link>
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  {content.receiptBtn}
                </Button>
                <Button variant="outline" asChild className="gap-2">
                  <Link to="/">
                    <Home className="w-4 h-4" />
                    {content.homeBtn}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
