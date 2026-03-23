import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Detect Android
    const android = /Android/.test(navigator.userAgent);
    setIsAndroid(android);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className={cn(
          "min-h-screen py-12 px-4",
          isRTL && "text-right"
        )}>
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg">
              <Smartphone className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold">تثبيت تطبيق رحلات</h1>
            <p className="text-muted-foreground text-lg">
              ثبّت التطبيق على هاتفك للوصول السريع والعمل بدون إنترنت
            </p>
          </div>

          {/* Already Installed */}
          {isInstalled && (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 text-success">
                  <Check className="w-8 h-8" />
                  <div>
                    <h3 className="font-bold text-lg">التطبيق مثبت بالفعل!</h3>
                    <p className="text-sm opacity-80">يمكنك فتحه من الشاشة الرئيسية</p>
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
                    <h3 className="font-bold text-lg">تثبيت سريع</h3>
                    <p className="text-sm text-muted-foreground">اضغط الزر للتثبيت مباشرة</p>
                  </div>
                </div>
                <Button 
                  onClick={handleInstall} 
                  className="w-full gap-2"
                  size="lg"
                >
                  <Download className="w-5 h-5" />
                  تثبيت التطبيق الآن
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
                  التثبيت على iPhone / iPad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                    <div>
                      <p className="font-medium">اضغط على زر المشاركة</p>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Share className="w-4 h-4" />
                        <span>في أسفل المتصفح</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                    <div>
                      <p className="font-medium">اختر "إضافة إلى الشاشة الرئيسية"</p>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <PlusSquare className="w-4 h-4" />
                        <span>Add to Home Screen</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                    <div>
                      <p className="font-medium">اضغط "إضافة"</p>
                      <p className="text-muted-foreground text-sm">سيظهر التطبيق على شاشتك الرئيسية</p>
                    </div>
                  </div>
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
                  التثبيت على Android
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                    <div>
                      <p className="font-medium">افتح قائمة المتصفح</p>
                      <p className="text-muted-foreground text-sm">النقاط الثلاث في أعلى الشاشة</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                    <div>
                      <p className="font-medium">اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                    <div>
                      <p className="font-medium">وافق على التثبيت</p>
                      <p className="text-muted-foreground text-sm">سيظهر التطبيق على شاشتك الرئيسية</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>مميزات التطبيق المثبت</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-success" />
                  <span>وصول سريع من الشاشة الرئيسية</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-success" />
                  <span>يعمل بدون شريط المتصفح (شاشة كاملة)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-success" />
                  <span>تحميل أسرع وأداء محسّن</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-success" />
                  <span>يعمل حتى مع ضعف الاتصال</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
