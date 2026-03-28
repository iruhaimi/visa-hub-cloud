import { Outlet } from 'react-router-dom';
import HeaderArabic from './HeaderArabic';
import FooterArabic from './FooterArabic';
import FloatingWhatsApp from './FloatingWhatsApp';
import CookieConsent from './CookieConsent';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

export default function MainLayout() {
  useRealtimeSync();
  return (
    <div className="flex min-h-screen flex-col">
      <HeaderArabic />
      <main className="flex-1">
        <Outlet />
      </main>
      <FooterArabic />
      <FloatingWhatsApp />
      <CookieConsent />
    </div>
  );
}
