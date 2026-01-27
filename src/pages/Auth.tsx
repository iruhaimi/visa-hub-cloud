import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plane, Loader2, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';

  useEffect(() => {
    if (user) {
      navigate('/');
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
      navigate('/');
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
        description: 'مرحباً بك في عطلات رحلاتكم. تم إنشاء حسابك بنجاح.',
      });
      navigate('/');
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
                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                    <FormField
                      control={signUpForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{isRTL ? 'الاسم الكامل' : 'Full Name'}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={isRTL ? 'محمد أحمد' : 'John Doe'} 
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{isRTL ? 'البريد الإلكتروني' : 'Email'}</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="example@email.com" 
                              dir="ltr" 
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{isRTL ? 'كلمة المرور' : 'Password'}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                dir="ltr"
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              dir="ltr" 
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      {isRTL ? 'إنشاء الحساب' : 'Create Account'}
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...signInForm}>
                  <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                    <FormField
                      control={signInForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{isRTL ? 'البريد الإلكتروني' : 'Email'}</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="example@email.com" 
                              dir="ltr" 
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signInForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{isRTL ? 'كلمة المرور' : 'Password'}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                dir="ltr"
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      {isRTL ? 'تسجيل الدخول' : 'Sign In'}
                    </Button>
                  </form>
                </Form>
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