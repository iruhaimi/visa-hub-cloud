import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react';

interface AdvancedCaptchaProps {
  onVerified: (verified: boolean) => void;
}

type ChallengeType = 'math' | 'text' | 'pattern';

export default function AdvancedCaptcha({ onVerified }: AdvancedCaptchaProps) {
  const [challengeType, setChallengeType] = useState<ChallengeType>('math');
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState<'+' | '-' | '×'>('+');
  const [textChallenge, setTextChallenge] = useState('');
  const [patternChallenge, setPatternChallenge] = useState<string[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showError, setShowError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate distorted text for canvas
  const generateDistortedText = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let text = '';
    for (let i = 0; i < 5; i++) {
      text += chars[Math.floor(Math.random() * chars.length)];
    }
    return text;
  }, []);

  // Generate pattern challenge (select matching shapes)
  const generatePatternChallenge = useCallback(() => {
    const shapes = ['●', '■', '▲', '◆', '★', '♦', '♣', '♠'];
    const pattern = [];
    for (let i = 0; i < 4; i++) {
      pattern.push(shapes[Math.floor(Math.random() * shapes.length)]);
    }
    return pattern;
  }, []);

  // Draw captcha text on canvas with distortion
  const drawCaptcha = useCallback((text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 100 + 100}, ${Math.random() * 100 + 100}, ${Math.random() * 100 + 100}, 0.5)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Add noise dots
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw text with distortion
    const fontSize = 28;
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textBaseline = 'middle';

    text.split('').forEach((char, i) => {
      const x = 20 + i * 35;
      const y = canvas.height / 2 + (Math.random() * 10 - 5);
      const rotation = (Math.random() * 30 - 15) * Math.PI / 180;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      // Random color
      const colors = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7'];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });
  }, []);

  const generateChallenge = useCallback(() => {
    // Randomly select challenge type
    const types: ChallengeType[] = ['math', 'text', 'pattern'];
    const type = types[Math.floor(Math.random() * types.length)];
    setChallengeType(type);

    if (type === 'math') {
      const operators: ('+' | '-' | '×')[] = ['+', '-', '×'];
      const op = operators[Math.floor(Math.random() * operators.length)];
      let n1 = Math.floor(Math.random() * 10) + 1;
      let n2 = Math.floor(Math.random() * 10) + 1;

      if (op === '-' && n2 > n1) {
        [n1, n2] = [n2, n1];
      }

      if (op === '×') {
        n1 = Math.floor(Math.random() * 5) + 1;
        n2 = Math.floor(Math.random() * 5) + 1;
      }

      setNum1(n1);
      setNum2(n2);
      setOperator(op);
    } else if (type === 'text') {
      const text = generateDistortedText();
      setTextChallenge(text);
      setTimeout(() => drawCaptcha(text), 50);
    } else {
      const pattern = generatePatternChallenge();
      setPatternChallenge(pattern);
    }

    setUserAnswer('');
    setIsVerified(false);
    setShowError(false);
    onVerified(false);
  }, [onVerified, generateDistortedText, generatePatternChallenge, drawCaptcha]);

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
      switch (operator) {
        case '+': return String(num1 + num2);
        case '-': return String(num1 - num2);
        case '×': return String(num1 * num2);
        default: return '0';
      }
    } else if (challengeType === 'text') {
      return textChallenge;
    } else {
      return patternChallenge.join('');
    }
  };

  const handleVerify = () => {
    const correct = getCorrectAnswer();
    const userInput = userAnswer.trim().toUpperCase();
    
    if (userInput === correct.toUpperCase()) {
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
          <div className="flex items-center justify-center gap-2 py-4 px-4 rounded-lg bg-slate-800 text-white text-xl font-mono">
            <span className="text-2xl">{num1}</span>
            <span className="text-primary text-2xl">{operator}</span>
            <span className="text-2xl">{num2}</span>
            <span className="text-slate-400">=</span>
            <span className="text-slate-400">?</span>
          </div>
        );
      case 'text':
        return (
          <div className="flex flex-col items-center gap-2">
            <canvas
              ref={canvasRef}
              width={200}
              height={60}
              className="rounded-lg border border-slate-600"
            />
            <p className="text-xs text-slate-500">أدخل الحروف والأرقام الظاهرة</p>
          </div>
        );
      case 'pattern':
        return (
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-3 py-4 px-6 rounded-lg bg-slate-800 text-3xl">
              {patternChallenge.map((shape, i) => (
                <span key={i} className="text-primary">{shape}</span>
              ))}
            </div>
            <p className="text-xs text-slate-500">أدخل الرموز بالترتيب (انسخها)</p>
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
              تم التحقق
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
