import { Link } from 'react-router-dom';
import { Mail, Phone, Clock, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import logo from '@/assets/logo.jpeg';

export default function FooterArabic() {
  const { t } = useLanguage();

  const quickLinks = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.destinations'), href: '/destinations' },
    { name: t('nav.pricing'), href: '/pricing' },
    { name: t('nav.track'), href: '/track' },
    { name: t('nav.faq'), href: '/faq' },
    { name: t('nav.about'), href: '/about' },
    { name: t('nav.contact'), href: '/contact' },
  ];

  const policyLinks = [
    { name: t('footer.terms'), href: '/terms' },
    { name: t('footer.privacy'), href: '/privacy' },
    { name: t('footer.refund'), href: '/refund' },
  ];

  return (
    <footer className="border-t border-border bg-card">
      <div className="container-section py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={logo} 
                alt="عطلات رحلاتكم" 
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              {t('footer.about')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground">{t('footer.quickLinks')}</h3>
            <ul className="mt-4 space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="font-semibold text-foreground">{t('footer.policies')}</h3>
            <ul className="mt-4 space-y-3">
              {policyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground">تواصل معنا</h3>
            <div className="mt-4 space-y-3">
              <a 
                href="tel:920034158" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span dir="ltr">920034158</span>
              </a>
              <a 
                href="mailto:info@rhalat.com"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>info@rhalat.com</span>
              </a>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>السبت - الخميس: ١٢ ظ - ١٠ م</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} عطلات رحلاتكم للسياحة والسفر. {t('footer.rights')}.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            هذا الموقع يقدم خدمات المساعدة في إصدار التأشيرات ولا يمثل أي سفارة أو جهة حكومية رسمية.
          </p>
        </div>
      </div>
    </footer>
  );
}
