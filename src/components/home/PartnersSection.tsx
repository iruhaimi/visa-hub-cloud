import { motion } from 'framer-motion';
import { Building2, Plane, Landmark, Factory, Smartphone, Wifi } from 'lucide-react';

interface Partner {
  name: string;
  icon: typeof Building2;
  color: string;
}

const partners: Partner[] = [
  { name: 'الخطوط السعودية', icon: Plane, color: 'text-green-600' },
  { name: 'بنك الراجحي', icon: Landmark, color: 'text-blue-600' },
  { name: 'أرامكو السعودية', icon: Factory, color: 'text-emerald-600' },
  { name: 'سابك', icon: Building2, color: 'text-sky-600' },
  { name: 'الاتصالات السعودية', icon: Smartphone, color: 'text-purple-600' },
  { name: 'موبايلي', icon: Wifi, color: 'text-red-500' },
];

export default function PartnersSection() {
  return (
    <section className="py-16 bg-background overflow-hidden border-y border-border/50">
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
          <h3 className="text-2xl font-bold text-foreground">
            موثوق من قبل أفضل الشركات
          </h3>
        </motion.div>

        {/* Partners Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {partners.map((partner, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group"
            >
              <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 text-center h-full flex flex-col items-center justify-center gap-3">
                <div className={`w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors ${partner.color}`}>
                  <partner.icon className="h-7 w-7" />
                </div>
                <span className="font-semibold text-sm text-foreground">
                  {partner.name}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {[
            { icon: '🔒', text: 'مدفوعات آمنة 100%', bg: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' },
            { icon: '✅', text: 'معتمد رسمياً', bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' },
            { icon: '⭐', text: 'تقييم 4.9/5', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' },
            { icon: '🛡️', text: 'حماية كاملة للبيانات', bg: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800' },
          ].map((badge, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border ${badge.bg}`}
            >
              <span className="text-xl">{badge.icon}</span>
              <span className="text-sm font-medium text-foreground">{badge.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
