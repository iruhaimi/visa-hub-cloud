import { Outlet } from 'react-router-dom';
import HeaderArabic from './HeaderArabic';
import FooterArabic from './FooterArabic';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <HeaderArabic />
      <main className="flex-1">
        <Outlet />
      </main>
      <FooterArabic />
    </div>
  );
}
