import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, ArrowLeft, MessageCircleQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteContent } from '@/hooks/useSiteContent';

interface FAQItem {
  question: string;
  answer: string;
}

interface AccordionItemProps {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

function AccordionItem({ item, isOpen, onToggle, index }: AccordionItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <div className={`bg-card rounded-2xl border overflow-hidden transition-all duration-300 ${isOpen ? 'border-primary/30 shadow-lg shadow-primary/5' : 'border-border/50 hover:border-primary/20 hover:shadow-md'}`}>
        <button onClick={onToggle} className="w-full flex items-center justify-between p-5 md:p-6 text-right">
          <div className="flex items-center gap-4 flex-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isOpen ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}>
              <span className="font-bold">{index + 1}</span>
            </div>
            <h3 className={`font-bold text-lg transition-colors ${isOpen ? 'text-primary' : 'text-foreground'}`}>{item.question}</h3>
          </div>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} className={`flex-shrink-0 mr-4 ${isOpen ? 'text-primary' : 'text-muted-foreground'}`}>
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
              <div className="px-5 md:px-6 pb-5 md:pb-6 pr-20">
                <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface FAQSectionProps {
  t: (key: string) => string;
}

export default function FAQSection({ t }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { data: content } = useSiteContent('faq');

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Get first category questions from dynamic content, fallback to empty
  const categoriesData = content?.categories?.items || [];
  const firstCategoryQuestions = categoriesData[0]?.questions || [];
  
  // Take first 4 questions for the home page section
  const faqs: FAQItem[] = firstCategoryQuestions.slice(0, 4).map((q: any) => ({
    question: q.question || '',
    answer: q.answer || '',
  }));

  // Fallback if no dynamic content yet
  if (faqs.length === 0) {
    faqs.push(
      { question: 'كم تستغرق معالجة طلب التأشيرة؟', answer: 'تختلف مدة المعالجة حسب نوع التأشيرة والدولة. عادة ما تتراوح بين 3-14 يوم عمل.' },
      { question: 'ما هي المستندات المطلوبة عادةً؟', answer: 'تختلف المستندات حسب نوع التأشيرة. بشكل عام تحتاج: جواز سفر ساري المفعول، صور شخصية حديثة، كشف حساب بنكي.' },
      { question: 'هل الأسعار شاملة لرسوم السفارة؟', answer: 'نوضح في كل خدمة ما إذا كانت الرسوم شاملة أو غير شاملة لرسوم التأشيرة الحكومية.' },
      { question: 'ماذا لو تم رفض طلب التأشيرة؟', answer: 'نقدم استشارة مجانية لفهم أسباب الرفض وكيفية تحسين طلبك.' },
    );
  }

  return (
    <section className="py-24 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-section relative">
        <div className="grid lg:grid-cols-5 gap-12 items-start">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="lg:col-span-2 lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <MessageCircleQuestion className="h-4 w-4" />
              <span>الأسئلة الشائعة</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{t('faq.title')}</h2>
            <p className="text-lg text-muted-foreground mb-8">{t('faq.subtitle')}</p>

            <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">لم تجد إجابتك؟</h4>
                  <p className="text-sm text-muted-foreground mb-3">فريقنا جاهز لمساعدتك على مدار الساعة</p>
                  <Button asChild size="sm" className="rounded-full">
                    <Link to="/contact">تواصل معنا<ArrowLeft className="h-4 w-4 mr-2" /></Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button variant="outline" className="rounded-full" asChild>
                <Link to="/faq">عرض جميع الأسئلة<ArrowLeft className="h-4 w-4 mr-2" /></Link>
              </Button>
            </div>
          </motion.div>

          <div className="lg:col-span-3 space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} item={faq} isOpen={openIndex === index} onToggle={() => handleToggle(index)} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
