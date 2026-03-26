import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plane, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSection } from '@/hooks/useSiteContent';
import { useLanguage } from '@/contexts/LanguageContext';

interface CTASectionProps {
  t: (key: string) => string;
}

export default function CTASection({ t }: CTASectionProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { data: content } = useSiteSection('home', 'cta');

  const title = content ? (isRTL ? content.title : (content.title_en || content.title)) : (isRTL ? 'جاهز لبدء رحلتك؟' : 'Ready to Start Your Journey?');
  const description = content ? (isRTL ? content.description : (content.description_en || content.description)) : (isRTL ? 'قدّم على تأشيرتك اليوم مع عطلات رحلاتكم\nواستمتع بخدمة احترافية وسريعة' : 'Apply for your visa today\nand enjoy professional, fast service');
  const primaryBtn = content ? (isRTL ? content.primary_button : (content.primary_button_en || content.primary_button)) : (isRTL ? 'ابدأ طلبك الآن' : 'Apply Now');
  const secondaryBtn = content ? (isRTL ? content.secondary_button : (content.secondary_button_en || content.secondary_button)) : (isRTL ? 'اتصل بنا: 920034158' : 'Call Us: 920034158');

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <motion.div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/10 blur-xl" animate={{ y: [0, 20, 0], x: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity }} />
      <motion.div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-white/10 blur-xl" animate={{ y: [0, -20, 0], x: [0, -10, 0] }} transition={{ duration: 7, repeat: Infinity }} />

      <div className="container-section relative">
        <div className="max-w-3xl mx-auto text-center text-white">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <motion.div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <Plane className="h-8 w-8" />
            </motion.div>

            <h2 className="text-3xl md:text-5xl font-bold mb-6">{title}</h2>
            <p className="text-xl text-white/80 mb-10 leading-relaxed whitespace-pre-line">{description}</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="secondary" className="rounded-full px-8 h-14 text-lg shadow-xl hover:shadow-2xl transition-shadow" asChild>
                <Link to="/apply">
                  {primaryBtn}
                  <ArrowLeft className="h-5 w-5 mr-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg border-white/30 text-white hover:bg-white/10 hover:text-white" asChild>
                <a href="tel:920034158">
                  <Phone className="h-5 w-5 ml-2" />
                  {secondaryBtn}
                </a>
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span>{isRTL ? 'معالجة سريعة' : 'Fast Processing'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span>{isRTL ? 'أسعار تنافسية' : 'Competitive Prices'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span>{isRTL ? 'دعم متواصل' : 'Continuous Support'}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
