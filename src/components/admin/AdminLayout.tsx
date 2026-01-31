import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  Gift,
  RotateCcw,
  Image,
  ShieldAlert,
  UserCheck,
  ArrowLeftRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function AdminLayout() {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const { profile, isAdmin, isAgent, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      show: isAdmin,
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
      title: 'إدارة Hero',
      icon: Image,
      href: '/admin/hero',
      show: isAdmin,
    },
    {
      title: 'سجل محاولات الدخول',
      icon: ShieldAlert,
      href: '/admin/login-attempts',
      show: isAdmin,
    },
    {
      title: 'طلبات فك القفل',
      icon: UserCheck,
      href: '/admin/unlock-requests',
      show: isAdmin,
    },
    {
      title: 'طلبات الوكلاء',
      icon: ArrowLeftRight,
      href: '/admin/agent-requests',
      show: isAdmin,
    },
    {
      title: 'الإعدادات',
      icon: Settings,
      href: '/admin/settings',
      show: isAdmin,
    },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn("flex min-h-screen bg-muted/30", isRTL && "flex-row-reverse")}>
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed top-0 z-40 h-screen bg-card border-e transition-all duration-300",
            isRTL ? "right-0" : "left-0",
            sidebarOpen ? "w-64" : "w-16"
          )}
        >
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            {sidebarOpen && (
            <Link to="/" className="text-xl font-bold text-primary">
              عطلات رحلاتكم
            </Link>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isRTL ? "left" : "right"}>
                {sidebarOpen ? 'تصغير القائمة' : 'توسيع القائمة'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2 p-4">
            {menuItems.filter(item => item.show).map((item) => {
              const isActive = location.pathname === item.href;
              
              const linkContent = (
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span>{item.title}</span>}
                </Link>
              );

              // Show tooltip only when sidebar is collapsed
              if (!sidebarOpen) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side={isRTL ? "left" : "right"}>
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.href}>{linkContent}</div>;
            })}
          </nav>

          {/* User & Logout */}
          <div className="absolute bottom-0 left-0 right-0 border-t p-4">
            {sidebarOpen && (
              <div className="mb-3 text-sm">
                <p className="font-medium">{profile?.full_name || 'المستخدم'}</p>
                <p className="text-muted-foreground text-xs">
                  {isAdmin ? 'مشرف' : 'وكيل'}
                </p>
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn("w-full justify-start gap-3", !sidebarOpen && "justify-center")}
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" />
                  {sidebarOpen && <span>تسجيل الخروج</span>}
                </Button>
              </TooltipTrigger>
              {!sidebarOpen && (
                <TooltipContent side={isRTL ? "left" : "right"}>
                  تسجيل الخروج
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 transition-all duration-300",
            isRTL 
              ? (sidebarOpen ? "mr-64" : "mr-16")
              : (sidebarOpen ? "ml-64" : "ml-16")
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
    </TooltipProvider>
  );
}
