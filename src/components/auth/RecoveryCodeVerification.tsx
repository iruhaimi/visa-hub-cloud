import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Key, ArrowRight, AlertTriangle } from 'lucide-react';
import { filterArabicChars } from '@/lib/inputFilters';

interface RecoveryCodeVerificationProps {
  email: string;
  onVerify: (code: string) => Promise<boolean>;
  onCancel: () => void;
  onRequestUnlock: () => void;
}

// Helper function to mask email for security
const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (!domain) return '***@***.***';
  
  const [domainName, extension] = domain.split('.');
  
  let maskedLocal = '';
  if (localPart.length <= 2) {
    maskedLocal = '*'.repeat(localPart.length);
  } else {
    maskedLocal = localPart[0] + '*'.repeat(Math.min(localPart.length - 2, 5)) + localPart[localPart.length - 1];
  }
  
  const maskedDomain = domainName[0] + '*'.repeat(Math.min(domainName.length - 1, 4));
  
  return `${maskedLocal}@${maskedDomain}.${extension || '***'}`;
};

export default function RecoveryCodeVerification({
  email,
  onVerify,
  onCancel,
  onRequestUnlock,
}: RecoveryCodeVerificationProps) {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('يرجى إدخال رمز الاسترداد');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const success = await onVerify(code.trim().toUpperCase());
      if (!success) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setError('تجاوزت الحد الأقصى للمحاولات. يمكنك طلب فك القفل من المسؤول.');
        } else {
          setError(`رمز الاسترداد غير صحيح أو مستخدم سابقاً (${newAttempts}/3)`);
        }
        setCode('');
      }
    } catch (err) {
      setError('حدث خطأ في التحقق');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800/90 backdrop-blur-sm shadow-2xl">
      <CardHeader className="text-center space-y-4 pb-2">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
            <Key className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div>
          <CardTitle className="text-xl font-bold text-white">
            استخدام رمز الاسترداد
          </CardTitle>
          <CardDescription className="text-slate-400 mt-2">
            أدخل أحد رموز الاسترداد الاحتياطية للوصول لحسابك
          </CardDescription>
          <p className="text-sm text-slate-500 mt-1" dir="ltr">
            {maskEmail(email)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="recovery-code" className="text-slate-300">
              رمز الاسترداد
            </Label>
            <Input
              id="recovery-code"
              type="text"
              value={code}
              onChange={(e) => setCode(filterArabicChars(e.target.value).toUpperCase())}
              placeholder="XXXX-XXXX"
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary text-center font-mono text-lg tracking-widest"
              dir="ltr"
              disabled={verifying || attempts >= 3}
              autoComplete="off"
            />
            <p className="text-xs text-slate-500 text-center">
              أدخل أحد الرموز الـ 8 التي حصلت عليها عند التسجيل
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-5"
            disabled={verifying || !code.trim() || attempts >= 3}
          >
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                جاري التحقق...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 ml-2" />
                تأكيد الدخول
              </>
            )}
          </Button>

          {attempts >= 3 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">هل فقدت رموز الاسترداد؟</p>
                  <p className="text-xs mt-1 opacity-90">
                    يمكنك طلب فك قفل حسابك من مسؤول آخر.
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    className="text-amber-400 hover:text-amber-300 p-0 h-auto mt-2"
                    onClick={onRequestUnlock}
                  >
                    طلب فك القفل من المسؤول ←
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="w-full text-slate-400 hover:text-white"
          >
            العودة لتسجيل الدخول
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
