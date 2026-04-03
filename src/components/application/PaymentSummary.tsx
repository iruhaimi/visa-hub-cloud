
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle2, Clock, XCircle, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface Payment {
  id: string;
  amount: number;
  currency: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
  invoice_number: string | null;
}

const STATUS_MAP = {
  pending: { labelAr: 'بانتظار الدفع', labelEn: 'Pending', icon: Clock, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  completed: { labelAr: 'تم الدفع', labelEn: 'Paid', icon: CheckCircle2, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  failed: { labelAr: 'فشل الدفع', labelEn: 'Failed', icon: XCircle, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  refunded: { labelAr: 'تم الاسترداد', labelEn: 'Refunded', icon: RotateCcw, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
};

export function PaymentSummary({ applicationId, applicationStatus }: { applicationId: string; applicationStatus?: string }) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      const { data } = await supabase
        .from('payments')
        .select('id, amount, currency, status, payment_method, paid_at, created_at, invoice_number')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });
      setPayments((data || []) as Payment[]);
      setLoading(false);
    };
    fetchPayments();
  }, [applicationId]);

  if (loading) return null;

  // Show WhatsApp payment notice when no payments exist and status is whatsapp_pending
  const isWhatsApp = applicationStatus === 'whatsapp_pending';
  
  if (payments.length === 0 && !isWhatsApp) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-primary" />
          {isRTL ? 'ملخص الدفع' : 'Payment Summary'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 && isWhatsApp ? (
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {isRTL 
                ? '💬 سيتم تحصيل الرسوم بالتنسيق مع فريقنا عبر الواتساب' 
                : '💬 Fees will be collected in coordination with our team via WhatsApp'}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              {isRTL 
                ? 'سيتواصل معك أحد أعضاء فريقنا قريباً لإتمام عملية الدفع' 
                : 'A team member will contact you shortly to complete the payment'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map(p => {
              const st = STATUS_MAP[p.status];
              const Icon = st.icon;
              return (
                <div key={p.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold">
                      {p.amount} {p.currency === 'SAR' || !p.currency ? 'ر.س' : p.currency}
                    </span>
                    <Badge className={`${st.className} gap-1`}>
                      <Icon className="h-3 w-3" />
                      {isRTL ? st.labelAr : st.labelEn}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {p.payment_method && <span>{p.payment_method}</span>}
                    <span>
                      {format(new Date(p.paid_at || p.created_at), 'dd MMM yyyy', { locale: isRTL ? ar : enUS })}
                    </span>
                  </div>
                  {p.invoice_number && (
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? 'رقم الفاتورة: ' : 'Invoice: '}{p.invoice_number}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
