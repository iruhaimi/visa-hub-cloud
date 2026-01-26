import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, LayoutDashboard, FileText, Phone, Globe, MessageCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import logo from '@/assets/logo.jpeg';

export default function HeaderArabic() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, isAdmin, isAgent, signOut } = useAuth();
  const { language, setLanguage, t, direction } = useLanguage();
  const navigate = useNavigate();

  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.destinations'), href: '/destinations' },
    { name: t('nav.pricing'), href: '/pricing' },
    { name: t('nav.track'), href: '/track' },
    { name: t('nav.faq'), href: '/faq' },
    { name: t('nav.about'), href: '/about' },
    { name: t('nav.contact'), href: '/contact' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (isAdmin) return '/admin';
    if (isAgent) return '/agent';
    return '/dashboard';
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background shadow-sm">
      {/* Top Bar */}
      <div className="hidden lg:block border-b border-border/30 bg-muted/30">
        <div className="container-section flex h-10 items-center justify-between text-sm">
          <div className="flex items-center gap-6 text-muted-foreground">
            <a href="tel:920034158" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Phone className="h-3.5 w-3.5" />
              <span dir="ltr">920034158</span>
            </a>
            <a href="mailto:info@rhalat.com" className="hover:text-foreground transition-colors">
              info@rhalat.com
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://wa.me/966920034158" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-success hover:text-success/80 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>واتساب</span>
            </a>
            <Button variant="ghost" size="sm" onClick={toggleLanguage} className="h-7 px-2 text-xs">
              <Globe className="h-3.5 w-3.5" />
              <span className="mr-1">{language === 'ar' ? 'English' : 'عربي'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container-section flex h-20 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src={logo} 
            alt="عطلات رحلاتكم" 
            className="h-14 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="relative px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-primary group"
            >
              {item.name}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-3/4 rounded-full" />
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex lg:items-center lg:gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-3 h-10 rounded-full border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium max-w-[100px] truncate">
                    {profile?.full_name || t('nav.profile')}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-popover" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5 leading-none">
                    {profile?.full_name && (
                      <p className="font-medium text-sm">{profile.full_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={getDashboardLink()} className="cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="mr-2">{t('nav.dashboard')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="h-4 w-4" />
                    <span className="mr-2">{t('nav.profile')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/my-applications" className="cursor-pointer">
                    <FileText className="h-4 w-4" />
                    <span className="mr-2">{t('nav.myApplications')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4" />
                  <span className="mr-2">{t('nav.signOut')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild className="rounded-full">
                <Link to="/auth">{t('nav.signIn')}</Link>
              </Button>
              <Button asChild className="rounded-full px-6 shadow-md hover:shadow-lg transition-shadow">
                <Link to="/apply">{t('nav.startApplication')}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden gap-2 items-center">
          <Button variant="ghost" size="sm" onClick={toggleLanguage} className="h-9 w-9 p-0">
            <Globe className="h-4 w-4" />
          </Button>
          <a 
            href="https://wa.me/966920034158" 
            target="_blank" 
            rel="noopener noreferrer"
            className="h-9 w-9 flex items-center justify-center text-success"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-9 w-9"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border/50 bg-background animate-fade-in">
          <div className="space-y-1 px-4 pb-4 pt-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="block rounded-lg px-4 py-3 text-base font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 pt-4 border-t border-border/50">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-2 mb-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{profile?.full_name || 'المستخدم'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" asChild className="w-full justify-start rounded-lg">
                    <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="mr-2">{t('nav.dashboard')}</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-start rounded-lg">
                    <Link to="/my-applications" onClick={() => setMobileMenuOpen(false)}>
                      <FileText className="h-4 w-4" />
                      <span className="mr-2">{t('nav.myApplications')}</span>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-lg text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="mr-2">{t('nav.signOut')}</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild className="w-full rounded-lg">
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      {t('nav.signIn')}
                    </Link>
                  </Button>
                  <Button asChild className="w-full rounded-lg">
                    <Link to="/apply" onClick={() => setMobileMenuOpen(false)}>
                      {t('nav.startApplication')}
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
