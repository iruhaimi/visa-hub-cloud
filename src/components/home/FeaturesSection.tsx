import { motion } from 'framer-motion';
import { Headphones, Clock, Users, Shield, Sparkles, LucideIcon } from 'lucide-react';
import { useSiteSection } from '@/hooks/useSiteContent';
import { useLanguage } from '@/contexts/LanguageContext';

const ICON_MAP: Record<string, LucideIcon> = { Headphones, Clock, Users, Shield };
const GRADIENTS = [
  'bg-gradient-to-br from-blue-500 to-cyan-500',
  'bg-gradient-to-br from-purple-500 to-pink-500',
  'bg-gradient-to-br from-orange-500 to-amber-500',
  'bg-gradient-to-br from-green-500 to-emerald-500',
];

interface FeaturesSectionProps {
  t: (key: string) => string;
}

export default function FeaturesSection({ t }: FeaturesSectionProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { data: content } = useSiteSection('home', 'features');

  const items = content?.items || [
    { title: t('features.support'), description: t('features.supportDesc'), icon: 'Headphones' },
    { title: t('features.tracking'), description: t('features.trackingDesc'), icon: 'Clock' },
    { title: t('features.experts'), description: t('features.expertsDesc'), icon: 'Users' },
    { title: t('features.transparent'), description: t('features.transparentDesc'), icon: 'Shield' },
  ];

  const title = content ? (isRTL ? content.title : (content.title_en || content.title)) : t('features.title');
  const subtitle = content ? (isRTL ? content.subtitle : (content.subtitle_en || content.subtitle)) : t('features.subtitle');
  const badge = isRTL ? 'لماذا نحن؟' : 'Why Us?';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-muted/30 via-background to-background relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="container-section relative">
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', delay: 0.1 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            <span>{badge}</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </motion.div>

        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          {items.map((feature: any, index: number) => {
            const IconComp = ICON_MAP[feature.icon] || Shield;
            return (
              <motion.div key={index} variants={itemVariants} className="group">
                <div className="relative h-full bg-card rounded-3xl p-8 border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <motion.div className={`w-16 h-16 rounded-2xl ${GRADIENTS[index % GRADIENTS.length]} shadow-lg flex items-center justify-center mb-6`} whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <IconComp className="h-8 w-8 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                      {isRTL ? feature.title : (feature.title_en || feature.title)}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {isRTL ? feature.description : (feature.description_en || feature.description)}
                    </p>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
