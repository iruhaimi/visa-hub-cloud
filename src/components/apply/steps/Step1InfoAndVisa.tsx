import { useEffect, useCallback, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/DatePicker';
import CountryCodePicker from '@/components/ui/CountryCodePicker';
import TravelerCounter from '../TravelerCounter';
import PriceSummaryCard from '../PriceSummaryCard';
import SARSymbol from '@/components/ui/SARSymbol';
import {
  User, Mail, Phone, ArrowLeft, ArrowRight, CheckCircle,
  Loader2, LogIn, UserPlus, Eye, EyeOff, KeyRound, ChevronDown, ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  SCHENGEN_INFO,
  filterOutSchengenCountries,
  getSchengenCountries,
  isSchengenCountry,
} from '@/lib/schengenCountries';

// ─── Helpers ───────────────────────────────────────────────
const filterArabicChars = (v: string) =>
  v.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
const filterNonNumeric = (v: string) => v.replace(/[^0-9]/g, '');
const extractPhoneNumber = (phone: string | null): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/^\+?\d{1,3}[\s-]?/, '').replace(/\D/g, '');
  return cleaned.slice(0, 9);
};

// ─── Google Sign-In ────────────────────────────────────────
function GoogleSignInButton() {
  const { direction } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isRTL = direction === 'rtl';

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result?.error) {
        toast({ variant: 'destructive', title: isRTL ? 'فشل تسجيل الدخول' : 'Login Failed', description: result.error instanceof Error ? result.error.message : String(result.error) });
      }
    } catch {
      toast({ variant: 'destructive', title: isRTL ? 'خطأ' : 'Error', description: isRTL ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button type="button" variant="outline" size="lg" className="w-full h-12 gap-2" onClick={handleGoogleSignIn} disabled={isLoading}>
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      )}
      {isRTL ? 'تسجيل الدخول بحساب جوجل' : 'Sign in with Google'}
    </Button>
  );
}

// ─── Sign-In Form ──────────────────────────────────────────
function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const { direction } = useLanguage();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isRTL = direction === 'rtl';

  const schema = z.object({
    email: z.string().email(isRTL ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email'),
    password: z.string().min(6, isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters'),
  });

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const handleEmailInput = useCallback((e: React.FormEvent<HTMLInputElement>) => { const f = filterArabicChars(e.currentTarget.value); if (f !== e.currentTarget.value) { e.currentTarget.value = f; setValue('email', f); } }, [setValue]);
  const handlePasswordInput = useCallback((e: React.FormEvent<HTMLInputElement>) => { const f = filterArabicChars(e.currentTarget.value); if (f !== e.currentTarget.value) { e.currentTarget.value = f; setValue('password', f); } }, [setValue]);

  const onSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: isRTL ? 'فشل تسجيل الدخول' : 'Login Failed', description: error.message === 'Invalid login credentials' ? (isRTL ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password') : error.message });
    } else {
      toast({ title: isRTL ? 'مرحباً بعودتك!' : 'Welcome back!', description: isRTL ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully' });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2"><Mail className="w-4 h-4" />{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
        <Input type="email" placeholder="example@email.com" dir="ltr" inputMode="email" onInput={handleEmailInput} style={{ textAlign: 'left' }} className="h-12" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>{isRTL ? 'كلمة المرور' : 'Password'}</Label>
        <div className="relative">
          <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" dir="ltr" onInput={handlePasswordInput} style={{ textAlign: 'left' }} className="h-12 pe-10" {...register('password')} />
          <Button type="button" variant="ghost" size="icon" className="absolute end-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
          </Button>
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" size="lg" className="w-full h-12 gap-2" disabled={isLoading}>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
        {isRTL ? 'تسجيل الدخول' : 'Sign In'}
      </Button>
      <div className="text-center">
        <button type="button" onClick={() => { toast({ title: isRTL ? 'إعادة تعيين كلمة المرور' : 'Password Reset', description: isRTL ? 'سيتم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني المسجل' : 'A password reset link will be sent to your registered email' }); setTimeout(() => { window.location.href = '/auth?mode=forgot-password'; }, 1500); }} className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
          <KeyRound className="w-3 h-3" />{isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
        </button>
      </div>
      <div className="relative my-6"><Separator /><span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">{isRTL ? 'أو' : 'OR'}</span></div>
      <GoogleSignInButton />
    </form>
  );
}

// ─── Sign-Up Form ──────────────────────────────────────────
function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const { direction } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isRTL = direction === 'rtl';

  const schema = z.object({
    fullName: z.string().min(2, isRTL ? 'الاسم يجب أن يكون حرفين على الأقل' : 'Name must be at least 2 characters'),
    email: z.string().email(isRTL ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email'),
    password: z.string().min(6, isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters'),
  });

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({ resolver: zodResolver(schema), defaultValues: { fullName: '', email: '', password: '' } });

  const handleEmailInput = useCallback((e: React.FormEvent<HTMLInputElement>) => { const f = filterArabicChars(e.currentTarget.value); if (f !== e.currentTarget.value) { e.currentTarget.value = f; setValue('email', f); } }, [setValue]);
  const handlePasswordInput = useCallback((e: React.FormEvent<HTMLInputElement>) => { const f = filterArabicChars(e.currentTarget.value); if (f !== e.currentTarget.value) { e.currentTarget.value = f; setValue('password', f); } }, [setValue]);

  const onSubmit = async (data: { fullName: string; email: string; password: string }) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({ email: data.email, password: data.password, options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: data.fullName } } });
    setIsLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: isRTL ? 'فشل إنشاء الحساب' : 'Registration Failed', description: error.message.includes('already registered') ? (isRTL ? 'هذا البريد الإلكتروني مسجل مسبقاً' : 'This email is already registered') : error.message });
    } else {
      toast({ title: isRTL ? 'تم إنشاء الحساب!' : 'Account Created!', description: isRTL ? 'مرحباً بك في عطلات رحلاتكم!' : 'Welcome to Otolat Rahlatcom!' });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2"><User className="w-4 h-4" />{isRTL ? 'الاسم الكامل' : 'Full Name'}</Label>
        <Input placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name'} className="h-12" {...register('fullName')} />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>
      <div className="space-y-2">
        <Label className="flex items-center gap-2"><Mail className="w-4 h-4" />{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
        <Input type="email" placeholder="example@email.com" dir="ltr" inputMode="email" onInput={handleEmailInput} style={{ textAlign: 'left' }} className="h-12" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>{isRTL ? 'كلمة المرور' : 'Password'}</Label>
        <div className="relative">
          <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" dir="ltr" onInput={handlePasswordInput} style={{ textAlign: 'left' }} className="h-12 pe-10" {...register('password')} />
          <Button type="button" variant="ghost" size="icon" className="absolute end-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
          </Button>
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" size="lg" className="w-full h-12 gap-2" disabled={isLoading}>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        {isRTL ? 'إنشاء حساب' : 'Create Account'}
      </Button>
      <div className="relative my-6"><Separator /><span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">{isRTL ? 'أو' : 'OR'}</span></div>
      <GoogleSignInButton />
    </form>
  );
}

// ─── Personal Info Section (logged-in) ─────────────────────
function PersonalInfoSection({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const { t, direction } = useLanguage();
  const { applicationData, updateApplicationData } = useApplication();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [hasPreFilled, setHasPreFilled] = useState(false);

  const schema = z.object({
    fullName: z.string().min(3, t('validation.required')),
    email: z.string().email(t('validation.email')),
    phone: z.string().min(9, t('validation.phone')).max(9, direction === 'rtl' ? 'رقم الجوال يجب أن يكون 9 أرقام' : 'Phone must be 9 digits'),
    countryCode: z.string(),
  });
  type FormData = z.infer<typeof schema>;

  const { register, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: applicationData.fullName,
      email: applicationData.email,
      phone: applicationData.phone,
      countryCode: applicationData.countryCode || '+966',
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    if (!hasPreFilled && !authLoading && user && profile) {
      const profilePhone = extractPhoneNumber(profile.phone);
      if (!applicationData.fullName && profile.full_name) setValue('fullName', profile.full_name);
      if (!applicationData.email && user.email) setValue('email', user.email);
      if (!applicationData.phone && profilePhone) setValue('phone', profilePhone);
      setHasPreFilled(true);
    }
  }, [hasPreFilled, authLoading, user, profile, applicationData, setValue]);

  useEffect(() => {
    if (hasPreFilled) {
      updateApplicationData({
        fullName: watchedValues.fullName,
        email: watchedValues.email,
        phone: watchedValues.phone,
        countryCode: watchedValues.countryCode,
      });
    }
  }, [watchedValues.fullName, watchedValues.email, watchedValues.phone, watchedValues.countryCode, updateApplicationData, hasPreFilled]);

  const handleEmailInput = useCallback((e: React.FormEvent<HTMLInputElement>) => { const f = filterArabicChars(e.currentTarget.value); if (f !== e.currentTarget.value) { e.currentTarget.value = f; setValue('email', f); } }, [setValue]);
  const handlePhoneInput = useCallback((e: React.FormEvent<HTMLInputElement>) => { let f = filterNonNumeric(e.currentTarget.value); if (f.length > 9) f = f.slice(0, 9); if (f !== e.currentTarget.value) { e.currentTarget.value = f; setValue('phone', f); } }, [setValue]);

  const isComplete = !!(watchedValues.fullName && watchedValues.email?.includes('@') && watchedValues.phone?.length === 9);

  if (authLoading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {isComplete ? <CheckCircle className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-muted-foreground" />}
          <div className="text-start">
            <div className="font-semibold text-sm">{direction === 'rtl' ? 'البيانات الشخصية' : 'Personal Information'}</div>
            {isComplete && !expanded && (
              <div className="text-xs text-muted-foreground mt-0.5">{watchedValues.fullName} • {watchedValues.email}</div>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2"><User className="w-4 h-4" />{t('form.fullName')}</Label>
            <Input id="fullName" {...register('fullName')} placeholder={direction === 'rtl' ? 'أدخل اسمك الكامل' : 'Enter your full name'} className="h-12" />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2"><Mail className="w-4 h-4" />{t('form.email')}</Label>
            <Input id="email" type="email" inputMode="email" {...register('email')} onInput={handleEmailInput} placeholder="example@email.com" className="h-12 text-left" dir="ltr" style={{ textAlign: 'left' }} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="w-4 h-4" />{t('form.phone')}</Label>
            <div className="flex flex-row-reverse gap-2">
              <CountryCodePicker value={watchedValues.countryCode} onChange={(v) => setValue('countryCode', v)} />
              <Input id="phone" type="tel" inputMode="numeric" maxLength={9} {...register('phone')} onInput={handlePhoneInput} placeholder="5XXXXXXXX" className="flex-1 h-12 text-left" dir="ltr" style={{ textAlign: 'left' }} />
            </div>
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Visa Details Section ──────────────────────────────────
function VisaDetailsSection() {
  const { t, direction, language } = useLanguage();
  const { applicationData, updateApplicationData, calculateTotal } = useApplication();
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [initialized, setInitialized] = useState(false);
  const [isSchengenFromUrl, setIsSchengenFromUrl] = useState(false);

  const { data: countries } = useQuery({
    queryKey: ['countries-apply'],
    queryFn: async () => {
      const { data, error } = await supabase.from('countries').select('*').eq('is_active', true).order('display_order', { ascending: true }).order('name');
      if (error) throw error;
      return data;
    },
  });

  const schengenCountries = useMemo(() => countries ? getSchengenCountries(countries) : [], [countries]);
  const nonSchengenCountries = useMemo(() => countries ? filterOutSchengenCountries(countries) : [], [countries]);

  useEffect(() => {
    if (!initialized && countries && countries.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const countryCode = urlParams.get('country');
      if (countryCode === 'SCHENGEN') { setSelectedRegion('schengen'); setIsSchengenFromUrl(true); }
      else if (countryCode) {
        const country = countries.find(c => c.code === countryCode);
        if (country && !isSchengenCountry(country)) { setSelectedRegion(''); updateApplicationData({ countryId: country.id, countryName: country.name }); }
      }
      setInitialized(true);
    }
  }, [countries, initialized, updateApplicationData]);

  const { data: visaTypes, isLoading: visaTypesLoading } = useQuery({
    queryKey: ['visa-types-apply', applicationData.countryId],
    queryFn: async () => {
      if (!applicationData.countryId) return [];
      const { data, error } = await supabase.from('visa_types').select('*').eq('country_id', applicationData.countryId).eq('is_active', true).order('price');
      if (error) throw error;
      return data;
    },
    enabled: !!applicationData.countryId,
  });

  useEffect(() => {
    if (applicationData.visaTypeId && visaTypes) {
      const sv = visaTypes.find(v => v.id === applicationData.visaTypeId);
      if (sv) {
        const bp = Number(sv.price);
        const isInc = sv.fee_type === 'included';
        updateApplicationData({
          visaTypeName: sv.name,
          adultPrice: bp,
          childPrice: sv.child_price != null ? Number(sv.child_price) : Math.round(bp * 0.75),
          infantPrice: sv.infant_price != null ? Number(sv.infant_price) : Math.round(bp * 0.5),
          visaFeesIncluded: isInc,
          governmentFees: isInc ? 0 : (sv.government_fees != null ? Number(sv.government_fees) : Math.round(bp * 0.3)),
          govFeeAdult: isInc ? 0 : ((sv as any).gov_fee_adult != null ? Number((sv as any).gov_fee_adult) : 0),
          govFeeChild: isInc ? 0 : ((sv as any).gov_fee_child != null ? Number((sv as any).gov_fee_child) : 0),
          govFeeInfant: isInc ? 0 : ((sv as any).gov_fee_infant != null ? Number((sv as any).gov_fee_infant) : 0),
          priceNotes: sv.price_notes || '',
          priceNotesEn: sv.price_notes_en || '',
        });
      }
    }
  }, [applicationData.visaTypeId, visaTypes, updateApplicationData]);

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    updateApplicationData({ countryId: '', countryName: '', visaTypeId: '', visaTypeName: '' });
  };

  const handleCountryChange = (countryId: string) => {
    const c = countries?.find(x => x.id === countryId);
    updateApplicationData({ countryId, countryName: c?.name || '', visaTypeId: '', visaTypeName: '' });
  };

  const updateTravelers = (type: 'adults' | 'children' | 'infants', value: number) => {
    updateApplicationData({ travelers: { ...applicationData.travelers, [type]: value } });
  };

  const ArrowNextIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-4">
      {/* Mobile Price Summary */}
      <div className="lg:hidden">
        <details className="group">
          <summary className="flex items-center justify-between p-4 bg-primary/5 rounded-xl cursor-pointer list-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><SARSymbol size="sm" className="text-primary" /></div>
              <div>
                <span className="text-sm text-muted-foreground">{t('pricing.total')}</span>
                <div className="font-bold text-lg text-primary flex items-center gap-1">{calculateTotal().grandTotal.toLocaleString()}<SARSymbol size="sm" className="text-primary" /></div>
              </div>
            </div>
            <ArrowNextIcon className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-90" />
          </summary>
          <div className="mt-3"><PriceSummaryCard /></div>
        </details>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Country Selection */}
          {!isSchengenFromUrl && (
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">{t('form.country')}</Label>
              <Select
                value={selectedRegion || (applicationData.countryId && !isSchengenCountry(countries?.find(c => c.id === applicationData.countryId) || {}) ? applicationData.countryId : '')}
                onValueChange={(value) => {
                  if (value === 'schengen') handleRegionChange('schengen');
                  else { setSelectedRegion(''); handleCountryChange(value); }
                }}
              >
                <SelectTrigger className="h-12 text-sm sm:text-base">
                  <SelectValue placeholder={direction === 'rtl' ? 'اختر الوجهة' : 'Select destination'} />
                </SelectTrigger>
                <SelectContent>
                  {schengenCountries.length > 0 && (
                    <SelectItem value="schengen">
                      <div className="flex items-center gap-2"><img src={SCHENGEN_INFO.flag_url} alt="EU" className="w-5 h-4 object-cover rounded" /><span>{SCHENGEN_INFO.name}</span></div>
                    </SelectItem>
                  )}
                  {nonSchengenCountries.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2"><img src={c.flag_url || `https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} alt={c.name} className="w-5 h-4 object-cover rounded" /><span>{c.name}</span></div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedRegion === 'schengen' && (
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">{direction === 'rtl' ? 'اختر الدولة من شنغن' : 'Select Schengen country'}</Label>
              <Select value={applicationData.countryId} onValueChange={handleCountryChange}>
                <SelectTrigger className="h-12 text-sm sm:text-base"><SelectValue placeholder={direction === 'rtl' ? 'اختر الدولة' : 'Select country'} /></SelectTrigger>
                <SelectContent>
                  {schengenCountries.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2"><img src={c.flag_url || `https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} alt={c.name} className="w-5 h-4 object-cover rounded" /><span>{c.name}</span></div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Visa Type */}
          <div className="space-y-2">
            <Label className="text-sm sm:text-base">{t('form.visaType')}</Label>
            <Select value={applicationData.visaTypeId} onValueChange={(v) => updateApplicationData({ visaTypeId: v })} disabled={!applicationData.countryId || visaTypesLoading}>
              <SelectTrigger className="h-12 text-sm sm:text-base">
                <SelectValue placeholder={visaTypesLoading ? (direction === 'rtl' ? 'جاري التحميل...' : 'Loading...') : (direction === 'rtl' ? 'اختر نوع التأشيرة' : 'Select visa type')} />
              </SelectTrigger>
              <SelectContent>
                {visaTypes?.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    <div className="flex justify-between items-center w-full"><span>{v.name}</span><span className="text-primary font-medium ms-4 flex items-center gap-1">{Number(v.price).toLocaleString()}<SARSymbol size="xs" className="text-primary" /></span></div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Travel Date */}
          <div className="space-y-2">
            <Label className="text-sm sm:text-base">{t('form.travelDate')}</Label>
            <DatePicker value={applicationData.travelDate} onChange={(ds) => updateApplicationData({ travelDate: ds ? new Date(ds) : null })} placeholder={direction === 'rtl' ? 'اختر تاريخ السفر' : 'Pick a travel date'} isRTL={direction === 'rtl'} minDate={new Date()} />
          </div>

          {/* Travelers */}
          <div className="space-y-3">
            <Label className="text-sm sm:text-base font-semibold">{t('form.travelers')}</Label>
            <TravelerCounter label={t('form.adults')} description={t('pricing.adult')} value={applicationData.travelers.adults} price={applicationData.adultPrice} min={1} onChange={(v) => updateTravelers('adults', v)} />
            <TravelerCounter label={t('form.children')} description={t('pricing.child')} value={applicationData.travelers.children} price={applicationData.childPrice} onChange={(v) => updateTravelers('children', v)} />
            <TravelerCounter label={t('form.infants')} description={t('pricing.infant')} value={applicationData.travelers.infants} price={applicationData.infantPrice} onChange={(v) => updateTravelers('infants', v)} />
          </div>
        </div>

        {/* Desktop Price Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24"><PriceSummaryCard /></div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Merged Step Component ────────────────────────────
export default function Step1InfoAndVisa() {
  const { t, direction } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { applicationData, goToNextStep } = useApplication();
  const [authCompleted, setAuthCompleted] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(true);

  const handleAuthSuccess = useCallback(() => setAuthCompleted(true), []);

  useEffect(() => { if (authCompleted && user) setAuthCompleted(false); }, [authCompleted, user]);

  // Auto-collapse personal info if data is complete
  const isInfoComplete = !!(applicationData.fullName && applicationData.email?.includes('@') && applicationData.phone?.length >= 9);

  useEffect(() => {
    if (isInfoComplete) setInfoExpanded(false);
  }, [isInfoComplete]);

  const ArrowNextIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const ArrowPrevIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  const canProceed = isInfoComplete && applicationData.visaTypeId && applicationData.travelDate &&
    (applicationData.travelers.adults + applicationData.travelers.children + applicationData.travelers.infants) > 0;

  if (authLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // Not logged in → auth forms
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">{direction === 'rtl' ? 'تسجيل الدخول للمتابعة' : 'Sign in to Continue'}</h2>
          <p className="text-muted-foreground mt-2">{direction === 'rtl' ? 'سجل دخولك أو أنشئ حساباً جديداً لمتابعة طلب التأشيرة' : 'Sign in or create an account to continue your visa application'}</p>
        </div>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin" className="gap-2"><LogIn className="w-4 h-4" />{direction === 'rtl' ? 'تسجيل الدخول' : 'Sign In'}</TabsTrigger>
            <TabsTrigger value="signup" className="gap-2"><UserPlus className="w-4 h-4" />{direction === 'rtl' ? 'حساب جديد' : 'Sign Up'}</TabsTrigger>
          </TabsList>
          <TabsContent value="signin"><SignInForm onSuccess={handleAuthSuccess} /></TabsContent>
          <TabsContent value="signup"><SignUpForm onSuccess={handleAuthSuccess} /></TabsContent>
        </Tabs>
      </div>
    );
  }

  // Logged in → combined form
  return (
    <div className="space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">{t('wizard.step1')}</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          {direction === 'rtl' ? 'أكمل بياناتك واختر تفاصيل التأشيرة' : 'Complete your info and select visa details'}
        </p>
      </div>

      {/* Personal Info - Collapsible */}
      <PersonalInfoSection expanded={infoExpanded} onToggle={() => setInfoExpanded(!infoExpanded)} />

      {/* Visa Details */}
      <VisaDetailsSection />

      {/* Navigation */}
      <div className="flex gap-3 pt-4 sticky bottom-0 bg-background/95 backdrop-blur-sm pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent sm:backdrop-blur-none border-t sm:border-0">
        <Button type="button" size="lg" className="flex-1 h-12 gap-2 text-sm sm:text-base" onClick={goToNextStep} disabled={!canProceed}>
          <span>{t('wizard.next')}</span>
          <ArrowNextIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
