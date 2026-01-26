import { motion } from 'framer-motion';
import { Headphones, Clock, Users, Shield, LucideIcon } from 'lucide-react';

interface FeaturesSectionProps {
  t: (key: string) => string;
}

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}

export default function FeaturesSection({ t }: FeaturesSectionProps) {
  const features: Feature[] = [
    {
      icon: Headphones,
      title: t('features.support'),
      description: t('features.supportDesc'),
      gradient: 'from-blue-500/10 to-cyan-500/10',
    },
    {
      icon: Clock,
      title: t('features.tracking'),
      description: t('features.trackingDesc'),
      gradient: 'from-purple-500/10 to-pink-500/10',
    },
    {
      icon: Users,
      title: t('features.experts'),
      description: t('features.expertsDesc'),
      gradient: 'from-orange-500/10 to-red-500/10',
    },
    {
      icon: Shield,
      title: t('features.transparent'),
      description: t('features.transparentDesc'),
      gradient: 'from-green-500/10 to-emerald-500/10',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
  };

  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container-section relative">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            لماذا نحن؟
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="group"
            >
              <div className={`relative h-full bg-gradient-to-br ${feature.gradient} rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300`}>
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative">
                  {/* Icon */}
                  <motion.div 
                    className="w-14 h-14 rounded-xl bg-background shadow-lg flex items-center justify-center mb-4 group-hover:shadow-xl transition-shadow"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon className="h-7 w-7 text-primary" />
                  </motion.div>

                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
