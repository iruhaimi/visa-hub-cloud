import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSection } from '@/hooks/useSiteContent';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  XCircle, 
  RefreshCw, 
  MessageCircle, 
  Home,
  Phone,
  Mail
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PaymentFailed() {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('id');
  const hasReset = useRef(false);
  const { data: cmsContent } = useSiteSection('payment_failed', 'content');

  useEffect(() => {
    if (!applicationId || hasReset.current) return;
    hasReset.current = true;

    const resetApplication = async () => {
      const { error } = await supabase
        .from('applications')
        .update({
          status: 'draft' as const,
          submitted_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId)
        .eq('status', 'pending_payment' as const);

      if (error) console.error('Error resetting application:', error);
    };
    resetApplication();
  }, [applicationId]);

  const t = (key: string, fallbackAr: string, fallbackEn: string) => {
    if (cmsContent) {
      return isRTL ? (cmsContent[key] || fallbackAr) : (cmsContent[key + '_en'] || cmsContent[key] || fallbackEn);
    }
    return isRTL ? fallbackAr : fallbackEn;
  };

  const reasons = cmsContent?.reasons || [
    { text: 'رصيد غير كافي في البطاقة', text_en: 'Insufficient card balance' },
    { text: 'انتهت صلاحية البطاقة', text_en: 'Card has expired' },
    { text: 'تم رفض العملية من البنك', text_en: 'Transaction declined by bank' },
    { text: 'مشكلة في الاتصال بالإنترنت', text_en: 'Internet connection issue' },
  ];
  const phone = cmsContent?.phone || '920034158';
  const email = cmsContent?.email || 'info@rhalat.com';

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-lg">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-destructive to-red-600 p-8 text-center text-white">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
              <XCircle className="w-20 h-20 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">{t('title', 'فشل الدفع', 'Payment Failed')}</h1>
            <p className="text-red-100">{t('subtitle', 'لم يتم إتمام عملية الدفع. يرجى المحاولة مرة أخرى.', 'The payment was not completed. Please try again.')}</p>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold">{t('reasons_title', 'أسباب محتملة', 'Possible Reasons')}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {reasons.map((reason: any, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    {isRTL ? reason.text : (reason.text_en || reason.text)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">{t('support_title', 'هل تحتاج مساعدة؟', 'Need Help?')}</h4>
              <p className="text-sm text-muted-foreground mb-3">{t('support_desc', 'فريق الدعم متاح لمساعدتك', 'Our support team is available to assist you')}</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <a href={`tel:${phone}`} className="flex items-center gap-1 text-primary hover:underline">
                  <Phone className="w-3 h-3" />
                  {phone}
                </a>
                <a href={`mailto:${email}`} className="flex items-center gap-1 text-primary hover:underline">
                  <Mail className="w-3 h-3" />
                  {email}
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full h-12 gap-2">
                <Link to={applicationId ? `/apply?draft=${applicationId}` : '/destinations'}>
                  <RefreshCw className="w-4 h-4" />
                  {t('try_again', 'حاول مرة أخرى', 'Try Again')}
                </Link>
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {t('contact_support', 'تواصل مع الدعم', 'Contact Support')}
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