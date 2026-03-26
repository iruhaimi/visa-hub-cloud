import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteContent } from '@/hooks/useSiteContent';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HelpCircle, 
  Search, 
  FileText, 
  CreditCard, 
  Clock, 
  Shield,
  Globe,
  MessageCircle,
  ChevronDown,
  Phone,
  Mail
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText, CreditCard, Clock, Shield, Globe, HelpCircle, MessageCircle, Phone, Mail, Search,
};

export default function FAQ() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const { data: content, isLoading } = useSiteContent('faq');

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const heroData = content?.hero || {};
  const categoriesData = content?.categories?.items || [];

  // Build categories from dynamic data
  const categories = categoriesData.map((cat: any) => ({
    icon: ICON_MAP[cat.icon] || HelpCircle,
    title: isRTL ? cat.title : (cat.title_en || cat.title),
    questions: (cat.questions || []).map((q: any) => ({
      question: isRTL ? q.question : (q.question_en || q.question),
      answer: isRTL ? q.answer : (q.answer_en || q.answer),
    })),
  }));

  // Filter FAQs based on search
  const filteredCategories = categories.map((category: any) => ({
    ...category,
    questions: category.questions.filter((q: any) => {
      const query = searchQuery.toLowerCase();
      return q.question.toLowerCase().includes(query) || q.answer.toLowerCase().includes(query);
    })
  })).filter((category: any) => category.questions.length > 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <section className="bg-gradient-to-br from-primary via-primary/95 to-primary/85 py-20">
          <div className="container-section text-center">
            <Skeleton className="w-20 h-20 rounded-full mx-auto mb-6" />
            <Skeleton className="h-12 w-80 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
        </section>
        <div className="container-section py-16 space-y-6 max-w-4xl mx-auto">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/85 py-20 overflow-hidden">
        <div className="absolute inset-0">
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.15, 0.1] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }} className="absolute bottom-10 left-10 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="container-section relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <HelpCircle className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {isRTL ? heroData.title : (heroData.title_en || heroData.title || 'الأسئلة الشائعة')}
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
              {isRTL ? heroData.description : (heroData.description_en || heroData.description || '')}
            </p>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="max-w-lg mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`} />
                <Input
                  type="text"
                  placeholder={isRTL ? 'ابحث عن سؤال...' : 'Search for a question...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${isRTL ? 'pl-4 pr-12' : 'pr-4 pl-12'} py-6 text-base bg-white text-foreground rounded-2xl shadow-2xl border-0`}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div className="container-section py-16">
        {filteredCategories.length > 0 ? (
          <motion.div className="space-y-8 max-w-4xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
            {filteredCategories.map((category: any, categoryIndex: number) => {
              const Icon = category.icon;
              return (
                <motion.div key={categoryIndex} variants={itemVariants}>
                  <Card className="shadow-lg overflow-hidden border-0">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-4 p-6 border-b bg-gradient-to-r from-primary/5 to-transparent" dir={isRTL ? 'rtl' : 'ltr'}>
                        <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" />
                        </motion.div>
                        <h2 className={`text-xl font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{category.title}</h2>
                        <Badge variant="secondary" className={isRTL ? 'mr-auto' : 'ml-auto'}>{category.questions.length}</Badge>
                      </div>
                      
                      <div className="divide-y" dir={isRTL ? 'rtl' : 'ltr'}>
                        {category.questions.map((faq: any, faqIndex: number) => {
                          const itemKey = `${categoryIndex}-${faqIndex}`;
                          const isOpen = openItems[itemKey];
                          return (
                            <div key={faqIndex}>
                              <button onClick={() => toggleItem(itemKey)} className="w-full flex items-center justify-between p-5 hover:bg-muted/50 transition-colors" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                                <div className="flex items-center gap-3 flex-1">
                                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${isOpen ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{faqIndex + 1}</span>
                                  <span className={`font-medium transition-colors ${isOpen ? 'text-primary' : ''}`} style={{ textAlign: isRTL ? 'right' : 'left' }}>{faq.question}</span>
                                </div>
                                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} className={`flex-shrink-0 ${isRTL ? 'mr-4' : 'ml-4'} ${isOpen ? 'text-primary' : 'text-muted-foreground'}`}>
                                  <ChevronDown className="h-5 w-5" />
                                </motion.div>
                              </button>
                              <AnimatePresence>
                                {isOpen && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                                    <div className={`px-5 pb-5 ${isRTL ? 'pl-16' : 'pr-16'}`}>
                                      <p className="text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-xl" style={{ textAlign: isRTL ? 'right' : 'left' }}>{faq.answer}</p>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{isRTL ? 'لم يتم العثور على نتائج' : 'No Results Found'}</h3>
            <p className="text-muted-foreground">{isRTL ? 'جرب البحث بكلمات مختلفة' : 'Try searching with different keywords'}</p>
          </motion.div>
        )}

        {/* Still Have Questions */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16">
          <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border-primary/20 max-w-4xl mx-auto overflow-hidden">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-8 flex flex-col justify-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                    <MessageCircle className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{isRTL ? 'لم تجد إجابة لسؤالك؟' : "Didn't Find Your Answer?"}</h3>
                  <p className="text-muted-foreground mb-6">{isRTL ? 'فريق الدعم لدينا جاهز لمساعدتك على مدار الساعة' : 'Our support team is ready to help you around the clock'}</p>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild className="rounded-xl"><Link to="/contact">{isRTL ? 'تواصل معنا' : 'Contact Us'}</Link></Button>
                    <Button variant="outline" className="rounded-xl gap-2" asChild>
                      <a href="https://wa.me/966920034158" target="_blank" rel="noopener"><MessageCircle className="w-4 h-4" />{isRTL ? 'واتساب' : 'WhatsApp'}</a>
                    </Button>
                  </div>
                </div>
                <div className="bg-primary/5 p-8 flex flex-col justify-center gap-4">
                  <div className="flex items-center gap-4 bg-background rounded-xl p-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><Phone className="w-5 h-5 text-primary" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">{isRTL ? 'اتصل بنا' : 'Call Us'}</p>
                      <p className="font-semibold" dir="ltr">920034158</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-background rounded-xl p-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><Mail className="w-5 h-5 text-primary" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">{isRTL ? 'راسلنا' : 'Email Us'}</p>
                      <p className="font-semibold">info@rhalat.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
