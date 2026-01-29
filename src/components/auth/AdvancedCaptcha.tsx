import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react';

interface AdvancedCaptchaProps {
  onVerified: (verified: boolean) => void;
}

// Only use secure challenge types - removed pattern type
type ChallengeType = 'math' | 'text';

export default function AdvancedCaptcha({ onVerified }: AdvancedCaptchaProps) {
  const [challengeType, setChallengeType] = useState<ChallengeType>('text');
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [num3, setNum3] = useState(0);
  const [operator1, setOperator1] = useState<'+' | '-' | '×'>('+');
  const [operator2, setOperator2] = useState<'+' | '-' | '×'>('+');
  const [textChallenge, setTextChallenge] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showError, setShowError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate distorted text with mix of uppercase, lowercase, and numbers
  const generateDistortedText = useCallback(() => {
    // Mix of uppercase, lowercase and numbers (excluding similar-looking characters)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let text = '';
    for (let i = 0; i < 6; i++) {
      text += chars[Math.floor(Math.random() * chars.length)];
    }
    return text;
  }, []);

  // Draw captcha text on canvas with heavy distortion
  const drawCaptcha = useCallback((text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with dark background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add more aggressive noise lines (crossing through text)
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 150 + 100}, ${Math.random() * 150 + 100}, ${Math.random() * 150 + 100}, 0.7)`;
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.bezierCurveTo(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * canvas.width,
        Math.random() * canvas.height
      );
      ctx.stroke();
    }

    // Add noise dots
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.4)`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2 + 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw text with heavy distortion
    const baseSize = 26;
    ctx.textBaseline = 'middle';

    text.split('').forEach((char, i) => {
      const fontSize = baseSize + (Math.random() * 8 - 4);
      ctx.font = `bold ${fontSize}px "Courier New", monospace`;
      
      const x = 18 + i * 38;
      const y = canvas.height / 2 + (Math.random() * 16 - 8);
      const rotation = (Math.random() * 40 - 20) * Math.PI / 180;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      // Apply slight skew
      ctx.transform(1, Math.random() * 0.3 - 0.15, Math.random() * 0.3 - 0.15, 1, 0, 0);

      // Random colors with good contrast
      const colors = ['#3b82f6', '#22c55e', '#eab308', '#f97316', '#a855f7', '#ec4899'];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      
      // Add slight shadow/outline for depth
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });

    // Add more overlay noise after text
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 200 + 50}, ${Math.random() * 200 + 50}, ${Math.random() * 200 + 50}, 0.3)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * canvas.height);
      ctx.lineTo(canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
  }, []);

  const generateChallenge = useCallback(() => {
    // Randomly select between math and text (both are secure)
    const types: ChallengeType[] = ['math', 'text'];
    const type = types[Math.floor(Math.random() * types.length)];
    setChallengeType(type);

    if (type === 'math') {
      // Generate more complex math problems
      const operators: ('+' | '-' | '×')[] = ['+', '-', '×'];
      const op1 = operators[Math.floor(Math.random() * operators.length)];
      const op2 = operators[Math.floor(Math.random() * operators.length)];
      
      let n1, n2, n3;
      
      // Different difficulty based on operators
      if (op1 === '×' || op2 === '×') {
        n1 = Math.floor(Math.random() * 6) + 2; // 2-7
        n2 = Math.floor(Math.random() * 5) + 1; // 1-5
        n3 = Math.floor(Math.random() * 5) + 1; // 1-5
      } else {
        n1 = Math.floor(Math.random() * 15) + 5; // 5-19
        n2 = Math.floor(Math.random() * 10) + 1; // 1-10
        n3 = Math.floor(Math.random() * 8) + 1; // 1-8
      }
      
      // Ensure subtraction doesn't go negative
      if (op1 === '-' && n2 > n1) {
        [n1, n2] = [n2, n1];
      }

      setNum1(n1);
      setNum2(n2);
      setNum3(n3);
      setOperator1(op1);
      setOperator2(op2);
    } else {
      const text = generateDistortedText();
      setTextChallenge(text);
      setTimeout(() => drawCaptcha(text), 50);
    }

    setUserAnswer('');
    setIsVerified(false);
    setShowError(false);
    onVerified(false);
  }, [onVerified, generateDistortedText, drawCaptcha]);

  useEffect(() => {
    generateChallenge();
  }, [generateChallenge]);

  useEffect(() => {
    if (challengeType === 'text' && textChallenge) {
      drawCaptcha(textChallenge);
    }
  }, [challengeType, textChallenge, drawCaptcha]);

  const getCorrectAnswer = (): string => {
    if (challengeType === 'math') {
      // Calculate step by step: (n1 op1 n2) op2 n3
      let result1: number;
      switch (operator1) {
        case '+': result1 = num1 + num2; break;
        case '-': result1 = num1 - num2; break;
        case '×': result1 = num1 * num2; break;
        default: result1 = 0;
      }
      
      let finalResult: number;
      switch (operator2) {
        case '+': finalResult = result1 + num3; break;
        case '-': finalResult = result1 - num3; break;
        case '×': finalResult = result1 * num3; break;
        default: finalResult = 0;
      }
      
      return String(finalResult);
    } else {
      return textChallenge;
    }
  };

  const handleVerify = () => {
    const correct = getCorrectAnswer();
    const userInput = userAnswer.trim();
    
    // Case-sensitive for text, exact match for math
    const isCorrect = challengeType === 'text' 
      ? userInput === correct 
      : userInput === correct;
    
    if (isCorrect) {
      setIsVerified(true);
      setShowError(false);
      onVerified(true);
    } else {
      setShowError(true);
      setAttempts(prev => prev + 1);
      setIsVerified(false);
      onVerified(false);
      
      // After 3 failed attempts, generate new challenge
      if (attempts >= 2) {
        setTimeout(() => {
          setAttempts(0);
          generateChallenge();
        }, 1000);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userAnswer && !isVerified) {
      handleVerify();
    }
  };

  const renderChallenge = () => {
    switch (challengeType) {
      case 'math':
        return (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-2 py-4 px-4 rounded-lg bg-slate-800 text-white text-lg font-mono">
              <span className="text-xl">({num1}</span>
              <span className="text-primary text-xl">{operator1}</span>
              <span className="text-xl">{num2})</span>
              <span className="text-primary text-xl">{operator2}</span>
              <span className="text-xl">{num3}</span>
              <span className="text-slate-400">=</span>
              <span className="text-slate-400">?</span>
            </div>
            <p className="text-xs text-slate-500">احسب من اليسار لليمين</p>
          </div>
        );
      case 'text':
        return (
          <div className="flex flex-col items-center gap-2">
            <canvas
              ref={canvasRef}
              width={250}
              height={70}
              className="rounded-lg border border-slate-600"
            />
            <p className="text-xs text-slate-500">أدخل الحروف والأرقام كما تظهر (حساس لحالة الأحرف)</p>
          </div>
        );
    }
  };

  return (
    <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600 space-y-3">
      <Label className="text-slate-300 text-sm flex items-center gap-2">
        {isVerified ? (
          <ShieldCheck className="h-4 w-4 text-green-500" />
        ) : (
          <ShieldAlert className="h-4 w-4 text-amber-500" />
        )}
        🔐 التحقق الأمني - أثبت أنك إنسان
      </Label>
      
      <div className="flex items-center gap-3">
        <div className="flex-1">
          {renderChallenge()}
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

      {showError && (
        <p className="text-xs text-red-400 text-center animate-pulse">
          ❌ إجابة خاطئة. حاول مرة أخرى ({3 - attempts} محاولات متبقية)
        </p>
      )}

      <div className="flex gap-2">
        <Input
          type="text"
          value={userAnswer}
          onChange={(e) => {
            setUserAnswer(e.target.value);
            setShowError(false);
          }}
          onKeyPress={handleKeyPress}
          placeholder={challengeType === 'math' ? 'الإجابة' : 'أدخل النص'}
          className="flex-1 bg-slate-700/50 border-slate-600 text-white text-center font-mono"
          dir="ltr"
          disabled={isVerified}
          autoComplete="off"
        />
        <Button
          type="button"
          onClick={handleVerify}
          disabled={!userAnswer || isVerified}
          className={`min-w-[100px] ${isVerified ? 'bg-green-600 hover:bg-green-600' : ''}`}
        >
          {isVerified ? (
            <>
              <ShieldCheck className="h-4 w-4 ml-1" />
              تم ✓
            </>
          ) : (
            'تحقق'
          )}
        </Button>
      </div>

      {isVerified && (
        <p className="text-xs text-green-400 text-center flex items-center justify-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          ✓ تم التحقق بنجاح - أنت إنسان
        </p>
      )}
    </div>
  );
}
