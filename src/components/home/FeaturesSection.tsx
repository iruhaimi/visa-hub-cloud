import { motion } from 'framer-motion';
import { Headphones, Clock, Users, Shield, LucideIcon, Sparkles } from 'lucide-react';

interface FeaturesSectionProps {
  t: (key: string) => string;
}

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  iconBg: string;
  iconColor: string;
}

export default function FeaturesSection({ t }: FeaturesSectionProps) {
  const features: Feature[] = [
    {
      icon: Headphones,
      title: t('features.support'),
      description: t('features.supportDesc'),
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      iconColor: 'text-white',
    },
    {
      icon: Clock,
      title: t('features.tracking'),
      description: t('features.trackingDesc'),
      iconBg: 'bg-gradient-to-br from-purple-500 to-pink-500',
      iconColor: 'text-white',
    },
    {
      icon: Users,
      title: t('features.experts'),
      description: t('features.expertsDesc'),
      iconBg: 'bg-gradient-to-br from-orange-500 to-amber-500',
      iconColor: 'text-white',
    },
    {
      icon: Shield,
      title: t('features.transparent'),
      description: t('features.transparentDesc'),
      iconBg: 'bg-gradient-to-br from-green-500 to-emerald-500',
      iconColor: 'text-white',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-muted/30 via-background to-background relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="container-section relative">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
          >
            <Sparkles className="h-4 w-4" />
            <span>لماذا نحن؟</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group"
            >
              <div className="relative h-full bg-card rounded-3xl p-8 border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 overflow-hidden">
                {/* Hover Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Decorative Corner */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative">
                  {/* Icon Container */}
                  <motion.div 
                    className={`w-16 h-16 rounded-2xl ${feature.iconBg} shadow-lg flex items-center justify-center mb-6`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <feature.icon className={`h-8 w-8 ${feature.iconColor}`} />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Bottom Accent Line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { value: '+10K', label: 'عميل سعيد' },
            { value: '+50', label: 'وجهة سياحية' },
            { value: '24/7', label: 'دعم متواصل' },
            { value: '98%', label: 'نسبة الرضا' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
