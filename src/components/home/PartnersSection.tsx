import { motion } from 'framer-motion';

const partners = [
  { name: 'الخطوط السعودية', logo: '✈️' },
  { name: 'بنك الراجحي', logo: '🏦' },
  { name: 'أرامكو', logo: '⛽' },
  { name: 'سابك', logo: '🏭' },
  { name: 'الاتصالات السعودية', logo: '📱' },
  { name: 'موبايلي', logo: '📶' },
];

export default function PartnersSection() {
  return (
    <section className="py-16 bg-muted/30 overflow-hidden">
      <div className="container-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
            شركاؤنا في النجاح
          </p>
          <h3 className="text-xl font-bold text-foreground">
            موثوق من قبل أفضل الشركات
          </h3>
        </motion.div>

        {/* Infinite Scroll Animation */}
        <div className="relative">
          {/* Gradient Overlays */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none" />

          <motion.div
            className="flex gap-12"
            animate={{
              x: [0, -1200],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: 20,
                ease: 'linear',
              },
            }}
          >
            {/* Double the partners for seamless loop */}
            {[...partners, ...partners, ...partners].map((partner, index) => (
              <div
                key={index}
                className="flex-shrink-0 flex items-center gap-3 px-8 py-4 bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-3xl">{partner.logo}</span>
                <span className="font-semibold text-foreground whitespace-nowrap">
                  {partner.name}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6"
        >
          {[
            { icon: '🔒', text: 'مدفوعات آمنة 100%' },
            { icon: '✅', text: 'معتمد رسمياً' },
            { icon: '⭐', text: 'تقييم 4.9/5' },
            { icon: '🛡️', text: 'حماية كاملة للبيانات' },
          ].map((badge, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border/50"
            >
              <span className="text-lg">{badge.icon}</span>
              <span className="text-sm font-medium text-muted-foreground">{badge.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
