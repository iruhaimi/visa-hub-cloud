import { useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSection } from '@/hooks/useSiteContent';
import { supabase } from '@/integrations/supabase/client';
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
  const applicationId = searchParams.get('id');
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const hasUpdated = useRef(false);
  const { data: cmsContent } = useSiteSection('payment_success', 'content');

  useEffect(() => {
    if (!applicationId || hasUpdated.current) return;
    hasUpdated.current = true;

    const finalizeApplication = async () => {
      const { error } = await supabase
        .from('applications')
        .update({
          status: 'submitted' as const,
          draft_data: null,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId)
        .eq('status', 'pending_payment' as const);

      if (error) console.error('Error finalizing application:', error);
    };
    finalizeApplication();
  }, [applicationId]);

  const t = (key: string, fallbackAr: string, fallbackEn: string) => {
    if (cmsContent) {
      return isRTL ? (cmsContent[key] || fallbackAr) : (cmsContent[key + '_en'] || cmsContent[key] || fallbackEn);
    }
    return isRTL ? fallbackAr : fallbackEn;
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-lg">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 text-center text-white">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
              <CheckCircle2 className="w-20 h-20 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">{t('title', 'تم الدفع بنجاح!', 'Payment Successful!')}</h1>
            <p className="text-green-100">{t('subtitle', 'تم استلام طلبك وسيتم معالجته في أقرب وقت', 'Your application has been received and will be processed soon')}</p>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">{t('app_number', 'رقم طلبك هو', 'Your application number is')}</p>
              <p className="text-2xl font-mono font-bold text-primary tracking-wider">{applicationNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail className="w-5 h-5 text-primary" />
                <div className="text-sm">
                  <div className="text-muted-foreground">{t('email_sent', 'تم إرسال تأكيد على بريدك الإلكتروني', 'Confirmation email sent to your address')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="w-5 h-5 text-primary" />
                <div className="text-sm">
                  <div className="font-medium">5-7 {t('days', 'يوم عمل', 'business days')}</div>
                  <div className="text-muted-foreground text-xs">{t('processing_time', 'الوقت المتوقع للمعالجة', 'Expected processing time')}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('next_steps', 'الخطوات التالية', 'Next Steps')}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[1, 2, 3].map(i => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">{i}</span>
                    {t(`step${i}`, 
                      i === 1 ? 'سيتم مراجعة طلبك خلال 1-2 يوم عمل' : i === 2 ? 'ستصلك رسالة على بريدك الإلكتروني بالتحديثات' : 'يمكنك تتبع حالة طلبك في أي وقت',
                      i === 1 ? 'Your application will be reviewed within 1-2 business days' : i === 2 ? 'You will receive email updates on your application status' : 'You can track your application status anytime'
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full h-12 gap-2">
                <Link to={`/track?app=${applicationNumber}`}>
                  <Search className="w-4 h-4" />
                  {t('track_btn', 'تتبع الطلب', 'Track Application')}
                </Link>
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  {t('receipt_btn', 'تحميل الإيصال', 'Download Receipt')}
                </Button>
                <Button variant="outline" asChild className="gap-2">
                  <Link to="/">
                    <Home className="w-4 h-4" />
                    {t('home_btn', 'العودة للرئيسية', 'Back to Home')}
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