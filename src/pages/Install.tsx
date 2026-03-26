import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteContent } from '@/hooks/useSiteContent';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Smartphone, 
  Download, 
  Check, 
  Share, 
  PlusSquare,
  Chrome,
  Apple
} from 'lucide-react';
import HeaderArabic from '@/components/layout/HeaderArabic';
import FooterArabic from '@/components/layout/FooterArabic';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const { direction, language } = useLanguage();
  const isRTL = direction === 'rtl';
  const { data: content } = useSiteContent('install');
  
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  const t = (ar: string, en: string) => isRTL ? ar : en;
  const c = (section: string, key: string, fallbackAr: string, fallbackEn: string) => {
    const s = content?.[section];
    if (!s) return t(fallbackAr, fallbackEn);
    return isRTL ? (s[key] || fallbackAr) : (s[key + '_en'] || s[key] || fallbackEn);
  };

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    const android = /Android/.test(navigator.userAgent);
    setIsAndroid(android);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const heroData = content?.hero || {};
  const installedData = content?.installed || {};
  const quickData = content?.quick_install || {};
  const iosSteps = content?.ios_steps?.items || [];
  const androidSteps = content?.android_steps?.items || [];
  const features = content?.features?.items || [];

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderArabic />
      <main className="flex-1">
        <div className={cn("min-h-screen py-12 px-4", isRTL && "text-right")}>
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg">
              <Smartphone className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold">
              {c('hero', 'title', 'تثبيت تطبيق رحلات', 'Install Rhalat App')}
            </h1>
            <p className="text-muted-foreground text-lg">
              {c('hero', 'description', 'ثبّت التطبيق على هاتفك للوصول السريع والعمل بدون إنترنت', 'Install the app on your phone for quick access and offline use')}
            </p>
          </div>

          {/* Already Installed */}
          {isInstalled && (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 text-success">
                  <Check className="w-8 h-8" />
                  <div>
                    <h3 className="font-bold text-lg">
                      {c('installed', 'title', 'التطبيق مثبت بالفعل!', 'App Already Installed!')}
                    </h3>
                    <p className="text-sm opacity-80">
                      {c('installed', 'description', 'يمكنك فتحه من الشاشة الرئيسية', 'You can open it from the home screen')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Install Button for Android/Desktop */}
          {deferredPrompt && !isInstalled && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Chrome className="w-8 h-8 text-primary" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">
                      {c('quick_install', 'title', 'تثبيت سريع', 'Quick Install')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {c('quick_install', 'description', 'اضغط الزر للتثبيت مباشرة', 'Press the button to install directly')}
                    </p>
                  </div>
                </div>
                <Button onClick={handleInstall} className="w-full gap-2" size="lg">
                  <Download className="w-5 h-5" />
                  {c('quick_install', 'button', 'تثبيت التطبيق الآن', 'Install App Now')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* iOS Instructions */}
          {isIOS && !isInstalled && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Apple className="w-6 h-6" />
                  {c('ios_steps', 'title', 'التثبيت على iPhone / iPad', 'Install on iPhone / iPad')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {(iosSteps.length > 0 ? iosSteps : [
                    { title: 'اضغط على زر المشاركة', title_en: 'Tap the Share button', description: 'في أسفل المتصفح', description_en: 'At the bottom of the browser' },
                    { title: 'اختر "إضافة إلى الشاشة الرئيسية"', title_en: 'Choose "Add to Home Screen"', description: 'Add to Home Screen', description_en: 'Add to Home Screen' },
                    { title: 'اضغط "إضافة"', title_en: 'Tap "Add"', description: 'سيظهر التطبيق على شاشتك الرئيسية', description_en: 'The app will appear on your home screen' },
                  ]).map((step: any, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{i + 1}</div>
                      <div>
                        <p className="font-medium">{isRTL ? step.title : (step.title_en || step.title)}</p>
                        {(isRTL ? step.description : (step.description_en || step.description)) && (
                          <p className="text-muted-foreground text-sm">{isRTL ? step.description : (step.description_en || step.description)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Android Manual Instructions */}
          {isAndroid && !deferredPrompt && !isInstalled && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Chrome className="w-6 h-6" />
                  {c('android_steps', 'title', 'التثبيت على Android', 'Install on Android')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {(androidSteps.length > 0 ? androidSteps : [
                    { title: 'افتح قائمة المتصفح', title_en: 'Open browser menu', description: 'النقاط الثلاث في أعلى الشاشة', description_en: 'The three dots at the top of the screen' },
                    { title: 'اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"', title_en: 'Choose "Install App" or "Add to Home Screen"' },
                    { title: 'وافق على التثبيت', title_en: 'Confirm installation', description: 'سيظهر التطبيق على شاشتك الرئيسية', description_en: 'The app will appear on your home screen' },
                  ]).map((step: any, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{i + 1}</div>
                      <div>
                        <p className="font-medium">{isRTL ? step.title : (step.title_en || step.title)}</p>
                        {(isRTL ? step.description : (step.description_en || step.description)) && (
                          <p className="text-muted-foreground text-sm">{isRTL ? step.description : (step.description_en || step.description)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>
                {c('features', 'title', 'مميزات التطبيق المثبت', 'Installed App Features')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {(features.length > 0 ? features : [
                  { text: 'وصول سريع من الشاشة الرئيسية', text_en: 'Quick access from home screen' },
                  { text: 'يعمل بدون شريط المتصفح (شاشة كاملة)', text_en: 'Works without browser bar (full screen)' },
                  { text: 'تحميل أسرع وأداء محسّن', text_en: 'Faster loading and improved performance' },
                  { text: 'يعمل حتى مع ضعف الاتصال', text_en: 'Works even with poor connection' },
                ]).map((feature: any, i: number) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-success" />
                    <span>{isRTL ? feature.text : (feature.text_en || feature.text)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      </main>
      <FooterArabic />
    </div>
  );
}