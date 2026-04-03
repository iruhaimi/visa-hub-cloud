import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Gift,
  RotateCcw,
  Image,
  ShieldAlert,
  UserCheck,
  ArrowLeftRight,
  Crown,
  Shield,
  FileSearch,
  PanelBottom,
  Pencil,
  Mail,
  CalendarClock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function AdminLayout() {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const { profile, isAdmin, signOut } = useAuth();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const location = useLocation();

  const menuItems = [
    {
      title: 'لوحة التحكم',
      icon: LayoutDashboard,
      href: isAdmin ? '/admin' : '/agent',
      show: true,
    },
    {
      title: 'الطلبات',
      icon: FileText,
      href: isAdmin ? '/admin/applications' : '/agent/applications',
      show: true,
    },
    {
      title: 'المستخدمين',
      icon: Users,
      href: '/admin/users',
      show: isAdmin && isSuperAdmin,
    },
    {
      title: 'العروض الخاصة',
      icon: Gift,
      href: '/admin/offers',
      show: isAdmin,
    },
    {
      title: 'طلبات الاسترداد',
      icon: RotateCcw,
      href: '/admin/refunds',
      show: isAdmin,
    },
    {
      title: 'إدارة الهيرو',
      icon: Image,
      href: '/admin/hero',
      show: isAdmin && isSuperAdmin,
    },
    {
      title: 'إدارة الفوتر',
      icon: PanelBottom,
      href: '/admin/footer',
      show: isAdmin && isSuperAdmin,
    },
    {
      title: 'إدارة المحتوى',
      icon: Pencil,
      href: '/admin/content',
      show: isAdmin && isSuperAdmin,
    },
    {
      title: 'طلبات فتح الحساب',
      icon: UserCheck,
      href: '/admin/unlock-requests',
      show: isAdmin && isSuperAdmin,
    },
    {
      title: 'سجل محاولات الدخول',
      icon: Shield,
      href: '/admin/login-attempts',
      show: isAdmin && isSuperAdmin,
    },
    {
      title: 'سجل الوصول للمستندات',
      icon: FileSearch,
      href: '/admin/document-logs',
      show: isAdmin && isSuperAdmin,
    },
    {
      title: 'مواعيد السفارات',
      icon: CalendarClock,
      href: '/admin/appointment-dates',
      show: isAdmin && (isSuperAdmin || hasPermission('manage_appointments' as any)),
    },
    {
      title: 'طلبات نقل الطلبات',
      icon: ArrowLeftRight,
      href: '/admin/agent-requests',
      show: isAdmin,
    },
    {
      title: 'العمليات الحساسة',
      icon: ShieldAlert,
      href: '/admin/sensitive-operations',
      show: isAdmin && isSuperAdmin,
    },
    {
      title: 'إعدادات المالك',
      icon: Crown,
      href: '/admin/owner-settings',
      show: isAdmin && isSuperAdmin,
    },
    {
      title: 'سجل الإيميلات',
      icon: Mail,
      href: '/admin/email-logs',
      show: isAdmin && isSuperAdmin,
    },
    {
      title: 'الإعدادات',
      icon: Settings,
      href: '/admin/settings',
      show: isAdmin,
    },
  ];

  const handleSignOut = async () => {
    await signOut(true);
  };

  return (
    <div className={cn('flex min-h-screen w-full bg-muted/30', isRTL && 'flex-row-reverse')}>
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-e bg-card">
        <div className="flex h-16 items-center border-b px-4">
          <Link to="/" className="text-xl font-bold text-primary">
            عطلات رحلاتكم
          </Link>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {menuItems
            .filter((item) => item.show)
            .map((item) => {
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
        </nav>

        <div className="border-t p-4">
          <div className="mb-3 text-sm">
            <div className="flex items-center gap-2 font-medium">
              {profile?.full_name || 'المستخدم'}
              {isSuperAdmin ? (
                <Badge className="border-0 bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                  <Crown className="mr-0.5 h-2.5 w-2.5" />
                  مالك
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">{isAdmin ? 'مشرف' : 'وكيل'}</span>
              )}
            </div>
          </div>

          <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
            <span>تسجيل الخروج</span>
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
          <h1 className="text-lg font-semibold">{isAdmin ? 'لوحة تحكم المشرف' : 'لوحة تحكم الوكيل'}</h1>
        </header>

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
