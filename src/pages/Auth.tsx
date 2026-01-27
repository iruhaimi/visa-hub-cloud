import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plane, Loader2, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

const REQUIRED_PROFILE_FIELDS = [
  'full_name', 'phone', 'date_of_birth', 'nationality',
  'passport_number', 'passport_expiry', 'address', 'city', 'country'
] as const;

const checkProfileCompleteness = async (userId: string): Promise<string[]> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile) return REQUIRED_PROFILE_FIELDS.slice();

  return REQUIRED_PROFILE_FIELDS.filter(field => {
    const value = profile[field as keyof typeof profile];
    return !value || (typeof value === 'string' && value.trim() === '');
  });
};

const signInSchema = z.object({
  email: z.string().email('يرجى إدخال بريد إلكتروني صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

const signUpSchema = z.object({
  fullName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
  email: z.string().email('يرجى إدخال بريد إلكتروني صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';

  useEffect(() => {
    if (user) {
      navigate('/profile');
    }
  }, [user, navigate]);

  useEffect(() => {
    setIsSignUp(searchParams.get('mode') === 'signup');
  }, [searchParams]);

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'فشل تسجيل الدخول',
        description: error.message === 'Invalid login credentials'
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
          : error.message,
      });
    } else {
      toast({
        title: 'مرحباً بعودتك!',
        description: 'تم تسجيل الدخول بنجاح',
      });

      // Check profile completeness and show reminder toast
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const missingFields = await checkProfileCompleteness(currentUser.id);
        if (missingFields.length > 0) {
          setTimeout(() => {
            toast({
              title: isRTL ? 'أكمل ملفك الشخصي' : 'Complete Your Profile',
              description: isRTL 
                ? `لديك ${missingFields.length} حقول ناقصة. يرجى استكمال بياناتك لتسهيل عملية التقديم.`
                : `You have ${missingFields.length} incomplete fields. Please complete your profile.`,
            });
          }, 1000);
        }
      }

      navigate('/profile');
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.fullName);
    setIsLoading(false);

    if (error) {
      let message = error.message;
      if (error.message.includes('already registered')) {
        message = 'هذا البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول بدلاً من ذلك.';
      }
      toast({
        variant: 'destructive',
        title: 'فشل إنشاء الحساب',
        description: message,
      });
    } else {
      toast({
        title: 'تم إنشاء الحساب!',
        description: 'مرحباً بك في عطلات رحلاتكم! يرجى استكمال بياناتك الشخصية.',
      });

      // Show profile completion reminder for new users
      setTimeout(() => {
        toast({
          title: isRTL ? 'أكمل ملفك الشخصي' : 'Complete Your Profile',
          description: isRTL 
            ? 'يرجى استكمال بياناتك الشخصية وبيانات جواز السفر لتسهيل عملية التقديم على التأشيرة.'
            : 'Please complete your personal and passport details to facilitate your visa application.',
        });
      }, 1500);

      navigate('/profile');
    }
  };

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
                {isSignUp 
                  ? (isRTL ? 'إنشاء حساب جديد' : 'Create an account')
                  : (isRTL ? 'مرحباً بعودتك' : 'Welcome back')
                }
              </CardTitle>
              <CardDescription>
                {isSignUp
                  ? (isRTL ? 'أدخل بياناتك لإنشاء حسابك' : 'Enter your details to create your account')
                  : (isRTL ? 'أدخل بياناتك للوصول إلى حسابك' : 'Enter your credentials to access your account')
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              {isSignUp ? (
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{isRTL ? 'الاسم الكامل' : 'Full Name'}</Label>
                    <Input placeholder={isRTL ? 'محمد أحمد' : 'John Doe'} {...signUpForm.register('fullName')} />
                    {signUpForm.formState.errors.fullName?.message && (
                      <p className="text-sm font-medium text-destructive">
                        {String(signUpForm.formState.errors.fullName.message)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                    <Input type="email" placeholder="example@email.com" dir="ltr" {...signUpForm.register('email')} />
                    {signUpForm.formState.errors.email?.message && (
                      <p className="text-sm font-medium text-destructive">
                        {String(signUpForm.formState.errors.email.message)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{isRTL ? 'كلمة المرور' : 'Password'}</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        dir="ltr"
                        {...signUpForm.register('password')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`absolute top-0 h-full px-3 hover:bg-transparent ${isRTL ? 'left-0' : 'right-0'}`}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {signUpForm.formState.errors.password?.message && (
                      <p className="text-sm font-medium text-destructive">
                        {String(signUpForm.formState.errors.password.message)}
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
                        {...signUpForm.register('confirmPassword')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`absolute top-0 h-full px-3 hover:bg-transparent ${isRTL ? 'left-0' : 'right-0'}`}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {signUpForm.formState.errors.confirmPassword?.message && (
                      <p className="text-sm font-medium text-destructive">
                        {String(signUpForm.formState.errors.confirmPassword.message)}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    {isRTL ? 'إنشاء الحساب' : 'Create Account'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                    <Input type="email" placeholder="example@email.com" dir="ltr" {...signInForm.register('email')} />
                    {signInForm.formState.errors.email?.message && (
                      <p className="text-sm font-medium text-destructive">
                        {String(signInForm.formState.errors.email.message)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{isRTL ? 'كلمة المرور' : 'Password'}</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        dir="ltr"
                        {...signInForm.register('password')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`absolute top-0 h-full px-3 hover:bg-transparent ${isRTL ? 'left-0' : 'right-0'}`}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {signInForm.formState.errors.password?.message && (
                      <p className="text-sm font-medium text-destructive">
                        {String(signInForm.formState.errors.password.message)}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    {isRTL ? 'تسجيل الدخول' : 'Sign In'}
                  </Button>
                </form>
              )}

              <div className="mt-6 text-center text-sm">
                {isSignUp ? (
                  <p className="text-muted-foreground">
                    {isRTL ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      className="font-medium text-primary hover:underline"
                    >
                      {isRTL ? 'تسجيل الدخول' : 'Sign in'}
                    </button>
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    {isRTL ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className="font-medium text-primary hover:underline"
                    >
                      {isRTL ? 'إنشاء حساب' : 'Sign up'}
                    </button>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Image/Branding */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 gradient-hero">
          <div className="flex h-full flex-col items-center justify-center px-12 text-center">
            <h2 className="text-4xl font-bold text-white">
              {isRTL ? 'رحلتك تبدأ من هنا' : 'Your Journey Starts Here'}
            </h2>
            <p className="mt-4 max-w-md text-lg text-white/90">
              {isRTL 
                ? 'بسّط عملية تقديم طلب التأشيرة مع منصتنا الموثوقة. سريع، آمن، وخالي من المتاعب.'
                : 'Simplify your visa application process with our trusted platform. Fast, secure, and hassle-free.'
              }
            </p>
            <div className={`mt-12 grid grid-cols-3 gap-8 text-white/80 ${isRTL ? 'direction-rtl' : ''}`}>
              <div>
                <div className="text-3xl font-bold text-white">+50</div>
                <div className="text-sm">{isRTL ? 'دولة' : 'Countries'}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">+10K</div>
                <div className="text-sm">{isRTL ? 'عميل سعيد' : 'Happy Clients'}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">98%</div>
                <div className="text-sm">{isRTL ? 'نسبة النجاح' : 'Success Rate'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}