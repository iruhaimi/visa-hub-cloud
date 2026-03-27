import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MailX, CheckCircle, AlertCircle } from 'lucide-react';

type Status = 'loading' | 'valid' | 'already' | 'invalid' | 'success' | 'error';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('loading');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(
        `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
        { headers: { apikey: anonKey } }
      );
      const data = await res.json();
      if (data.valid === false && data.reason === 'already_unsubscribed') {
        setStatus('already');
      } else if (data.valid) {
        setStatus('valid');
      } else {
        setStatus('invalid');
      }
    } catch {
      setStatus('invalid');
    }
  };

  const handleUnsubscribe = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus('success');
      } else if (data?.reason === 'already_unsubscribed') {
        setStatus('already');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">جاري التحقق...</p>
            </>
          )}

          {status === 'valid' && (
            <>
              <MailX className="h-12 w-12 text-warning mx-auto" />
              <h2 className="text-xl font-bold">إلغاء الاشتراك</h2>
              <p className="text-muted-foreground">
                هل أنت متأكد من رغبتك في إلغاء استقبال الإيميلات؟
              </p>
              <Button onClick={handleUnsubscribe} disabled={processing} variant="destructive">
                {processing && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                تأكيد إلغاء الاشتراك
              </Button>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-success mx-auto" />
              <h2 className="text-xl font-bold">تم إلغاء الاشتراك</h2>
              <p className="text-muted-foreground">لن تتلقى إيميلات منا بعد الآن.</p>
            </>
          )}

          {status === 'already' && (
            <>
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-bold">تم الإلغاء مسبقاً</h2>
              <p className="text-muted-foreground">لقد قمت بإلغاء الاشتراك بالفعل.</p>
            </>
          )}

          {status === 'invalid' && (
            <>
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-xl font-bold">رابط غير صالح</h2>
              <p className="text-muted-foreground">هذا الرابط غير صالح أو منتهي الصلاحية.</p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-xl font-bold">حدث خطأ</h2>
              <p className="text-muted-foreground">يرجى المحاولة مرة أخرى لاحقاً.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
