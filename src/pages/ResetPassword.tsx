import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plane, Loader2, Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';

  // Filter to remove Arabic characters from password fields
  const filterArabicChars = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const filtered = input.value.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
    if (filtered !== input.value) {
      input.value = filtered;
    }
  };

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if this is a recovery session (user came from email link)
      if (session) {
        setIsValidSession(true);
      } else {
        // Listen for auth state change (user might be redirected with tokens in URL)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY') {
            setIsValidSession(true);
          } else if (event === 'SIGNED_IN' && session) {
            setIsValidSession(true);
          }
        });

        // Give it a moment to process URL tokens
        setTimeout(() => {
          if (isValidSession === null) {
            setIsValidSession(false);
          }
        }, 2000);

        return () => subscription.unsubscribe();
      }
    };

    checkSession();
  }, []);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const handleSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });
    
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'فشل تحديث كلمة المرور' : 'Failed to update password',
        description: error.message,
      });
    } else {
      setIsSuccess(true);
      toast({
        title: isRTL ? 'تم تحديث كلمة المرور!' : 'Password updated!',
        description: isRTL 
          ? 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.'
          : 'Your password has been changed successfully. You can now sign in.',
      });
    }
  };

  // Show loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="flex min-h-screen items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">
            {isRTL ? 'جاري التحقق...' : 'Verifying...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error if no valid session
  if (isValidSession === false) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <CardTitle>
              {isRTL ? 'رابط غير صالح' : 'Invalid Link'}
            </CardTitle>
            <CardDescription>
              {isRTL 
                ? 'رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.'
                : 'This password reset link is invalid or has expired. Please request a new one.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/auth?mode=forgot-password">
                {isRTL ? 'طلب رابط جديد' : 'Request New Link'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${isRTL ? 'flex-row-reverse' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Left side - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              {isRTL ? 'العودة للرئيسية' : 'Back to home'}
            </Link>
          </div>

          <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="space-y-1 px-0 sm:px-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Plane className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-2xl font-bold">عطلات رحلاتكم</span>
              </div>
              <CardTitle className="text-2xl">
                {isSuccess 
                  ? (isRTL ? 'تم بنجاح!' : 'Success!')
                  : (isRTL ? 'تعيين كلمة مرور جديدة' : 'Set New Password')
                }
              </CardTitle>
              <CardDescription>
                {isSuccess
                  ? (isRTL ? 'تم تغيير كلمة المرور بنجاح' : 'Your password has been changed successfully')
                  : (isRTL ? 'أدخل كلمة المرور الجديدة لحسابك' : 'Enter your new password')
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              {isSuccess ? (
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      {isRTL 
                        ? 'يمكنك الآن استخدام كلمة المرور الجديدة لتسجيل الدخول'
                        : 'You can now use your new password to sign in'}
                    </p>
                  </div>
                  <Button asChild className="w-full">
                    <Link to="/auth">
                      {isRTL ? 'تسجيل الدخول' : 'Sign In'}
                    </Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{isRTL ? 'كلمة المرور الجديدة' : 'New Password'}</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        dir="ltr"
                        lang="en"
                        autoComplete="new-password"
                        onInput={filterArabicChars}
                        style={{ textAlign: 'left' }}
                        className="pr-10"
                        {...form.register('password')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {form.formState.errors.password?.message && (
                      <p className="text-sm font-medium text-destructive">
                        {String(form.formState.errors.password.message)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        dir="ltr"
                        lang="en"
                        autoComplete="new-password"
                        onInput={filterArabicChars}
                        style={{ textAlign: 'left' }}
                        className="pr-10"
                        {...form.register('confirmPassword')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {form.formState.errors.confirmPassword?.message && (
                      <p className="text-sm font-medium text-destructive">
                        {String(form.formState.errors.confirmPassword.message)}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    {isRTL ? 'تحديث كلمة المرور' : 'Update Password'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Image/Branding */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 gradient-hero">
          <div className="flex h-full flex-col items-center justify-center px-12 text-center">
            <h2 className="text-4xl font-bold text-white">
              {isRTL ? 'تأمين حسابك' : 'Securing Your Account'}
            </h2>
            <p className="mt-4 max-w-md text-lg text-white/90">
              {isRTL 
                ? 'أنشئ كلمة مرور قوية وآمنة لحماية حسابك ومعلوماتك الشخصية.'
                : 'Create a strong and secure password to protect your account and personal information.'
              }
            </p>
            <div className={`mt-12 space-y-4 text-white/80 text-start ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-white" />
                <span>{isRTL ? 'استخدم 6 أحرف على الأقل' : 'Use at least 6 characters'}</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-white" />
                <span>{isRTL ? 'امزج بين الأحرف والأرقام' : 'Mix letters and numbers'}</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-white" />
                <span>{isRTL ? 'أضف رموز خاصة للمزيد من الأمان' : 'Add special symbols for extra security'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
