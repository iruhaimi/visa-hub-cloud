import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, Globe, Award, Headphones } from 'lucide-react';

interface StatItem {
  icon: typeof Users;
  value: number;
  suffix: string;
  label: string;
  color: string;
}

const stats: StatItem[] = [
  {
    icon: Users,
    value: 10000,
    suffix: '+',
    label: 'عميل سعيد',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Globe,
    value: 50,
    suffix: '+',
    label: 'دولة نخدمها',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Award,
    value: 98,
    suffix: '%',
    label: 'نسبة النجاح',
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: Headphones,
    value: 24,
    suffix: '/7',
    label: 'دعم متواصل',
    color: 'from-green-500 to-emerald-500',
  },
];

function AnimatedCounter({ value, suffix, duration = 2 }: { value: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, value, duration]);

  // Format number in English
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  };

  return (
    <span ref={ref}>
      {formatNumber(count)}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary/95 to-primary/90 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        {/* Animated floating shapes */}
        <motion.div
          className="absolute top-20 right-20 w-20 h-20 border border-white/20 rounded-full"
          animate={{ y: [-10, 10, -10], rotate: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-16 h-16 border border-white/10 rounded-lg"
          animate={{ y: [10, -10, 10], rotate: [0, -180, -360] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="container-section relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            أرقام تتحدث عن نجاحنا
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            سنوات من الخبرة وآلاف العملاء السعداء
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="relative group"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-white/20 text-center hover:bg-white/15 transition-all duration-300">
                {/* Icon */}
                <motion.div
                  className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <stat.icon className="h-8 w-8 text-white" />
                </motion.div>

                {/* Value */}
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>

                {/* Label */}
                <p className="text-white/70 font-medium">{stat.label}</p>

                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
