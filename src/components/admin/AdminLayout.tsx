import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  PanelBottom
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function AdminLayout() {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const { profile, isAdmin, isAgent, signOut } = useAuth();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();

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
      show: isAdmin ? hasPermission('manage_applications') : true,
    },
    {
      title: 'المستخدمين',
      icon: Users,
      href: '/admin/users',
      show: isAdmin && hasPermission('manage_users'),
    },
    {
      title: 'العروض الخاصة',
      icon: Gift,
      href: '/admin/offers',
      show: isAdmin && hasPermission('manage_offers'),
    },
    {
      title: 'طلبات الاسترداد',
      icon: RotateCcw,
      href: '/admin/refunds',
      show: isAdmin && hasPermission('process_refunds'),
    },
    {
      title: 'إدارة الهيرو',
      icon: Image,
      href: '/admin/hero',
      show: isAdmin && hasPermission('manage_hero'),
    },
    {
      title: 'إدارة الفوتر',
      icon: PanelBottom,
      href: '/admin/footer',
      show: isAdmin && hasPermission('manage_settings'),
    },
    {
      title: 'طلبات فتح الحساب',
      icon: UserCheck,
      href: '/admin/unlock-requests',
      show: isAdmin && hasPermission('manage_unlock_requests'),
    },
    {
      title: 'سجل محاولات الدخول',
      icon: Shield,
      href: '/admin/login-attempts',
      show: isAdmin && hasPermission('manage_users'),
    },
    {
      title: 'سجل الوصول للمستندات',
      icon: FileSearch,
      href: '/admin/document-access-logs',
      show: isAdmin && hasPermission('manage_applications'),
    },
    {
      title: 'طلبات نقل الطلبات',
      icon: ArrowLeftRight,
      href: '/admin/agent-requests',
      show: isAdmin && hasPermission('manage_applications'),
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
      title: 'الإعدادات',
      icon: Settings,
      href: '/admin/settings',
      show: isAdmin && (hasPermission('manage_settings') || hasPermission('manage_countries')),
    },
  ];

  const handleSignOut = async () => {
    await signOut(true);
  };

  return (
    <div className={cn("flex min-h-screen bg-muted/30", isRTL && "flex-row-reverse")}>
      {/* Sidebar - always visible */}
      <aside
        className={cn(
          "fixed top-0 z-40 h-screen bg-card border-e w-64",
          isRTL ? "right-0" : "left-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-4">
          <Link to="/" className="text-xl font-bold text-primary">
            عطلات رحلاتكم
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 p-4">
          {menuItems.filter(item => item.show).map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* User & Logout */}
        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <div className="mb-3 text-sm">
            <p className="font-medium flex items-center gap-2">
              {profile?.full_name || 'المستخدم'}
              {isSuperAdmin ? (
                <Badge className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  <Crown className="h-2.5 w-2.5 mr-0.5" />
                  مالك
                </Badge>
              ) : (
                <span className="text-muted-foreground text-xs">
                  {isAdmin ? 'مشرف' : 'وكيل'}
                </span>
              )}
            </p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            <span>تسجيل الخروج</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1",
          isRTL ? "mr-64" : "ml-64"
        )}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
          <h1 className="text-lg font-semibold">
            {isAdmin ? 'لوحة تحكم المشرف' : 'لوحة تحكم الوكيل'}
          </h1>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
