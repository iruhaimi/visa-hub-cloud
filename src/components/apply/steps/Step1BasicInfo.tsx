import { useEffect, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CountryCodePicker from '@/components/ui/CountryCodePicker';
import { User, Mail, Phone, ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

// Helper function to filter Arabic characters
const filterArabicChars = (value: string): string => {
  return value.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
};

// Helper function to filter non-numeric characters (allow only digits)
const filterNonNumeric = (value: string): string => {
  return value.replace(/[^0-9]/g, '');
};

// Extract phone number without country code
const extractPhoneNumber = (phone: string | null): string => {
  if (!phone) return '';
  // Remove common country codes and spaces
  const cleaned = phone.replace(/^\+?\d{1,3}[\s-]?/, '').replace(/\D/g, '');
  return cleaned.slice(0, 9);
};

export default function Step1BasicInfo() {
  const { t, direction } = useLanguage();
  const { applicationData, updateApplicationData, goToNextStep } = useApplication();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [hasPreFilled, setHasPreFilled] = useState(false);

  const schema = z.object({
    fullName: z.string().min(3, t('validation.required')),
    email: z.string().email(t('validation.email')),
    phone: z.string().min(9, t('validation.phone')).max(9, direction === 'rtl' ? 'رقم الجوال يجب أن يكون 9 أرقام' : 'Phone must be 9 digits'),
    countryCode: z.string(),
  });

  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: applicationData.fullName,
      email: applicationData.email,
      phone: applicationData.phone,
      countryCode: applicationData.countryCode || '+966',
    },
  });

  const watchedValues = watch();

  // Pre-fill form with profile data when user is logged in
  useEffect(() => {
    if (!hasPreFilled && !authLoading && user && profile) {
      const profilePhone = extractPhoneNumber(profile.phone);
      
      // Only pre-fill if fields are empty
      if (!applicationData.fullName && profile.full_name) {
        setValue('fullName', profile.full_name);
      }
      if (!applicationData.email && user.email) {
        setValue('email', user.email);
      }
      if (!applicationData.phone && profilePhone) {
        setValue('phone', profilePhone);
      }
      
      setHasPreFilled(true);
    }
  }, [hasPreFilled, authLoading, user, profile, applicationData, setValue]);

  useEffect(() => {
    updateApplicationData({
      fullName: watchedValues.fullName,
      email: watchedValues.email,
      phone: watchedValues.phone,
      countryCode: watchedValues.countryCode,
    });
  }, [watchedValues.fullName, watchedValues.email, watchedValues.phone, watchedValues.countryCode, updateApplicationData]);

  // Handle email input - filter Arabic characters in real-time
  const handleEmailInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const filtered = filterArabicChars(input.value);
    if (filtered !== input.value) {
      input.value = filtered;
      setValue('email', filtered);
    }
  }, [setValue]);

  // Handle phone input - allow only digits and limit to 9 characters
  const handlePhoneInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    let filtered = filterNonNumeric(input.value);
    if (filtered.length > 9) {
      filtered = filtered.slice(0, 9);
    }
    if (filtered !== input.value) {
      input.value = filtered;
      setValue('phone', filtered);
    }
  }, [setValue]);

  const onSubmit = (data: FormData) => {
    updateApplicationData(data);
    goToNextStep();
  };

  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const isLoggedIn = !!user;
  const hasCompleteData = !!(watchedValues.fullName && watchedValues.email && watchedValues.phone?.length === 9);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">{t('wizard.step1')}</h2>
        <p className="text-muted-foreground mt-2">
          {direction === 'rtl' 
            ? 'أدخل بياناتك الأساسية للتواصل معك' 
            : 'Enter your basic information to contact you'}
        </p>
      </div>

      {/* Show logged-in status with pre-filled indicator */}
      {isLoggedIn && hasCompleteData && (
        <div className="p-4 bg-accent/50 rounded-lg border border-primary/20 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-primary shrink-0" />
          <div className="text-sm text-foreground">
            {direction === 'rtl' 
              ? 'تم تعبئة بياناتك تلقائياً من ملفك الشخصي. يمكنك تعديلها إذا لزم الأمر.' 
              : 'Your data has been auto-filled from your profile. You can modify it if needed.'}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            {t('form.fullName')}
          </Label>
          <Input
            id="fullName"
            {...register('fullName')}
            placeholder={direction === 'rtl' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
            className="h-12"
          />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            {t('form.email')}
          </Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            {...register('email')}
            onInput={handleEmailInput}
            placeholder="example@email.com"
            className="h-12 text-left"
            dir="ltr"
            style={{ textAlign: 'left' }}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            {t('form.phone')}
          </Label>
          <div className="flex flex-row-reverse gap-2">
            <CountryCodePicker
              value={watchedValues.countryCode}
              onChange={(value) => setValue('countryCode', value)}
            />
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              maxLength={9}
              {...register('phone')}
              onInput={handlePhoneInput}
              placeholder="5XXXXXXXX"
              className="flex-1 h-12 text-left"
              dir="ltr"
              style={{ textAlign: 'left' }}
            />
          </div>
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Country Selection Info */}
      {applicationData.countryName && (
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="text-sm text-muted-foreground">{t('form.country')}</div>
          <div className="font-semibold text-primary">{applicationData.countryName}</div>
        </div>
      )}

      <Button type="submit" size="lg" className="w-full h-12 gap-2">
        {t('wizard.next')}
        <ArrowIcon className="w-4 h-4" />
      </Button>
    </form>
  );
}
