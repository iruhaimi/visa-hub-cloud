import { motion } from 'framer-motion';
import { Building2, Plane, Landmark, Factory, Smartphone, Wifi, LucideIcon } from 'lucide-react';
import { useSiteSection } from '@/hooks/useSiteContent';
import { useLanguage } from '@/contexts/LanguageContext';

const ICON_MAP: Record<string, LucideIcon> = { Building2, Plane, Landmark, Factory, Smartphone, Wifi };
const COLORS = ['text-green-600', 'text-blue-600', 'text-emerald-600', 'text-sky-600', 'text-purple-600', 'text-red-500'];

const fallbackPartners = [
  { name: 'الخطوط السعودية', icon: 'Plane' },
  { name: 'بنك الراجحي', icon: 'Landmark' },
  { name: 'أرامكو السعودية', icon: 'Factory' },
  { name: 'سابك', icon: 'Building2' },
  { name: 'الاتصالات السعودية', icon: 'Smartphone' },
  { name: 'موبايلي', icon: 'Wifi' },
];

const fallbackBadges = [
  { icon: '🔒', text: 'مدفوعات آمنة 100%' },
  { icon: '✅', text: 'معتمد رسمياً' },
  { icon: '⭐', text: 'تقييم 4.9/5' },
  { icon: '🛡️', text: 'حماية كاملة للبيانات' },
];

export default function PartnersSection() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { data: content } = useSiteSection('home', 'partners');

  const partners = content?.items || fallbackPartners;
  const badges = content?.badges || fallbackBadges;
  const title = isRTL ? (content?.title || 'موثوق من قبل أفضل الشركات') : (content?.title_en || 'Trusted by Top Companies');
  const subtitle = isRTL ? (content?.subtitle || 'شركاؤنا في النجاح') : (content?.subtitle_en || 'Our Success Partners');

  return (
    <section className="py-16 bg-background overflow-hidden border-y border-border/50">
      <div className="container-section">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-10">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">{subtitle}</p>
          <h3 className="text-2xl font-bold text-foreground">{title}</h3>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {partners.map((partner: any, index: number) => {
            const IconComp = ICON_MAP[partner.icon] || Building2;
            const color = COLORS[index % COLORS.length];
            return (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.05, y: -5 }} className="group">
                <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 text-center h-full flex flex-col items-center justify-center gap-3">
                  <div className={`w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors ${color}`}>
                    <IconComp className="h-7 w-7" />
                  </div>
                  <span className="font-semibold text-sm text-foreground">
                    {isRTL ? partner.name : (partner.name_en || partner.name)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.6 }} className="flex flex-wrap items-center justify-center gap-4">
          {badges.map((badge: any, index: number) => {
            const bgClasses = [
              'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
              'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
              'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
              'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
            ];
            return (
              <motion.div key={index} whileHover={{ scale: 1.05 }} className={`flex items-center gap-2 px-5 py-2.5 rounded-full border ${bgClasses[index % bgClasses.length]}`}>
                <span className="text-xl">{badge.icon}</span>
                <span className="text-sm font-medium text-foreground">
                  {isRTL ? badge.text : (badge.text_en || badge.text)}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
