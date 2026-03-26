import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useSiteSection } from '@/hooks/useSiteContent';
import { useLanguage } from '@/contexts/LanguageContext';

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { data: content } = useSiteSection('not_found', 'hero');

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const title = content?.title || '404';
  const subtitle = isRTL 
    ? (content?.subtitle || 'عذراً! الصفحة غير موجودة')
    : (content?.subtitle_en || content?.subtitle || 'Oops! Page not found');
  const linkText = isRTL
    ? (content?.link_text || 'العودة للرئيسية')
    : (content?.link_text_en || content?.link_text || 'Return to Home');

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{title}</h1>
        <p className="mb-4 text-xl text-muted-foreground">{subtitle}</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {linkText}
        </a>
      </div>
    </div>
  );
};

export default NotFound;