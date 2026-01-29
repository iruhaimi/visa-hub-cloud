import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';

interface SimpleCaptchaProps {
  onVerified: (verified: boolean) => void;
}

export default function SimpleCaptcha({ onVerified }: SimpleCaptchaProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState<'+' | '-' | '×'>('+');
  const [userAnswer, setUserAnswer] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const generateChallenge = useCallback(() => {
    const operators: ('+' | '-' | '×')[] = ['+', '-', '×'];
    const op = operators[Math.floor(Math.random() * operators.length)];
    let n1 = Math.floor(Math.random() * 10) + 1;
    let n2 = Math.floor(Math.random() * 10) + 1;

    // Ensure subtraction doesn't result in negative
    if (op === '-' && n2 > n1) {
      [n1, n2] = [n2, n1];
    }

    // Keep multiplication simple
    if (op === '×') {
      n1 = Math.floor(Math.random() * 5) + 1;
      n2 = Math.floor(Math.random() * 5) + 1;
    }

    setNum1(n1);
    setNum2(n2);
    setOperator(op);
    setUserAnswer('');
    setIsVerified(false);
    onVerified(false);
  }, [onVerified]);

  useEffect(() => {
    generateChallenge();
  }, [generateChallenge]);

  const getCorrectAnswer = (): number => {
    switch (operator) {
      case '+': return num1 + num2;
      case '-': return num1 - num2;
      case '×': return num1 * num2;
      default: return 0;
    }
  };

  const handleVerify = () => {
    const correct = getCorrectAnswer();
    const userNum = parseInt(userAnswer, 10);
    
    if (userNum === correct) {
      setIsVerified(true);
      onVerified(true);
    } else {
      setIsVerified(false);
      onVerified(false);
      generateChallenge();
    }
  };

  return (
    <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600 space-y-3">
      <Label className="text-slate-300 text-sm flex items-center gap-2">
        🔐 التحقق الأمني
      </Label>
      
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded bg-slate-800 text-white text-lg font-mono">
          <span>{num1}</span>
          <span className="text-primary">{operator}</span>
          <span>{num2}</span>
          <span>=</span>
          <span>?</span>
        </div>
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={generateChallenge}
          className="text-slate-400 hover:text-white"
          title="تحديث السؤال"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          type="number"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="الإجابة"
          className="flex-1 bg-slate-700/50 border-slate-600 text-white text-center"
          dir="ltr"
          disabled={isVerified}
        />
        <Button
          type="button"
          onClick={handleVerify}
          disabled={!userAnswer || isVerified}
          className={`min-w-[80px] ${isVerified ? 'bg-green-600 hover:bg-green-600' : ''}`}
        >
          {isVerified ? '✓ تم' : 'تحقق'}
        </Button>
      </div>

      {isVerified && (
        <p className="text-xs text-green-400 text-center">
          ✓ تم التحقق بنجاح
        </p>
      )}
    </div>
  );
}
