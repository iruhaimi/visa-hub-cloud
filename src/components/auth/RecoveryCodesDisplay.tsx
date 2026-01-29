import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, Copy, Download, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface RecoveryCodesDisplayProps {
  codes: string[];
  onComplete: () => void;
  isFirstTime?: boolean;
}

export default function RecoveryCodesDisplay({
  codes,
  onComplete,
  isFirstTime = true,
}: RecoveryCodesDisplayProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [showCodes, setShowCodes] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    toast.success('تم نسخ الرمز');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllCodes = () => {
    navigator.clipboard.writeText(codes.join('\n'));
    toast.success('تم نسخ جميع الرموز');
  };

  const downloadCodes = () => {
    const content = `رموز الاسترداد الاحتياطية - عطلات رحلاتكم
=======================================
تاريخ الإنشاء: ${new Date().toLocaleString('ar-SA')}

هذه الرموز تستخدم لمرة واحدة فقط لاستعادة الوصول لحسابك.
احتفظ بها في مكان آمن!

${codes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

تحذير: كل رمز يمكن استخدامه مرة واحدة فقط.
=======================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovery-codes-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تحميل الرموز');
  };

  return (
    <Card className="border-slate-700 bg-slate-800/90 backdrop-blur-sm shadow-2xl max-w-lg mx-auto">
      <CardHeader className="text-center space-y-4 pb-2">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Key className="h-8 w-8 text-amber-500" />
          </div>
        </div>
        <div>
          <CardTitle className="text-xl font-bold text-white">
            رموز الاسترداد الاحتياطية
          </CardTitle>
          <CardDescription className="text-slate-400 mt-2">
            {isFirstTime
              ? 'احفظ هذه الرموز في مكان آمن. ستحتاجها لاستعادة الوصول لحسابك.'
              : 'تم إنشاء رموز جديدة. الرموز السابقة لم تعد صالحة.'}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4" dir="rtl">
        {/* Warning */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">تنبيه مهم!</p>
            <p className="text-xs mt-1 opacity-90">
              لن تتمكن من رؤية هذه الرموز مرة أخرى بعد إغلاق هذه النافذة.
              احفظها الآن في مكان آمن.
            </p>
          </div>
        </div>

        {/* Toggle visibility */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">رموز الاسترداد ({codes.length})</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCodes(!showCodes)}
            className="text-slate-400 hover:text-white"
          >
            {showCodes ? (
              <>
                <EyeOff className="h-4 w-4 ml-1" />
                إخفاء
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 ml-1" />
                إظهار
              </>
            )}
          </Button>
        </div>

        {/* Codes Grid */}
        <div className="grid grid-cols-2 gap-2">
          {codes.map((code, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-700/50 border border-slate-600 group"
            >
              <span className="font-mono text-sm text-white" dir="ltr">
                {showCodes ? code : '••••••••'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyCode(code, index)}
              >
                {copiedIndex === index ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-400" />
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            onClick={copyAllCodes}
          >
            <Copy className="h-4 w-4 ml-2" />
            نسخ الكل
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            onClick={downloadCodes}
          >
            <Download className="h-4 w-4 ml-2" />
            تحميل
          </Button>
        </div>

        {/* Confirmation Checkbox */}
        <div className="pt-4 border-t border-slate-700">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-700 text-primary focus:ring-primary"
            />
            <span className="text-sm text-slate-300">
              أؤكد أنني قمت بحفظ هذه الرموز في مكان آمن وأفهم أنني لن أتمكن من رؤيتها مرة أخرى.
            </span>
          </label>
        </div>

        <Button
          onClick={onComplete}
          disabled={!confirmed}
          className="w-full bg-primary hover:bg-primary/90 text-white"
        >
          <CheckCircle className="h-4 w-4 ml-2" />
          تم الحفظ - متابعة
        </Button>
      </CardContent>
    </Card>
  );
}
