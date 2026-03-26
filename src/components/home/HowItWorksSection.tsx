import { motion } from 'framer-motion';
import { Globe, FileText, Plane, CreditCard, CheckCircle, LucideIcon } from 'lucide-react';
import { useSiteSection } from '@/hooks/useSiteContent';
import { useLanguage } from '@/contexts/LanguageContext';

const ICON_MAP: Record<string, LucideIcon> = { Globe, FileText, Plane, CreditCard };
const COLORS = ['from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500', 'from-orange-500 to-red-500', 'from-green-500 to-emerald-500'];

interface HowItWorksSectionProps {
  t: (key: string) => string;
}

export default function HowItWorksSection({ t }: HowItWorksSectionProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { data: content } = useSiteSection('home', 'how_it_works');

  const items = content?.items || [
    { title: t('howItWorks.step1.title'), description: t('howItWorks.step1.desc'), icon: 'Globe' },
    { title: t('howItWorks.step2.title'), description: t('howItWorks.step2.desc'), icon: 'FileText' },
    { title: t('howItWorks.step3.title'), description: t('howItWorks.step3.desc'), icon: 'CreditCard' },
    { title: t('howItWorks.step4.title'), description: t('howItWorks.step4.desc'), icon: 'Plane' },
  ];

  const title = content ? (isRTL ? content.title : (content.title_en || content.title)) : t('howItWorks.title');
  const subtitle = content ? (isRTL ? content.subtitle : (content.subtitle_en || content.subtitle)) : t('howItWorks.subtitle');
  const badge = content ? (isRTL ? content.badge : (content.badge_en || content.badge)) : (isRTL ? 'خطوات بسيطة' : 'Simple Steps');

  return (
    <section className="py-20 bg-muted/30 overflow-hidden">
      <div className="container-section">
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">{badge}</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((step: any, index: number) => {
            const IconComp = ICON_MAP[step.icon] || Globe;
            return (
              <motion.div key={index} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.15 }} className="relative group">
                <div className="relative bg-card rounded-2xl p-6 shadow-lg border border-border/50 hover:shadow-xl hover:border-primary/30 transition-all duration-300 h-full">
                  <div className="absolute -top-4 right-6 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg">{index + 1}</div>
                  <motion.div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${COLORS[index % COLORS.length]} flex items-center justify-center mb-4 shadow-lg`} whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <IconComp className="h-8 w-8 text-white" />
                  </motion.div>
                  <h3 className="text-lg font-bold mb-2">{isRTL ? step.title : (step.title_en || step.title)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{isRTL ? step.description : (step.description_en || step.description)}</p>
                  <div className="absolute bottom-4 left-4">
                    <CheckCircle className="h-5 w-5 text-primary/30 group-hover:text-primary/60 transition-colors" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
