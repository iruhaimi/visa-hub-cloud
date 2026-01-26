import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  HelpCircle, 
  Search, 
  FileText, 
  CreditCard, 
  Clock, 
  Shield,
  Globe,
  MessageCircle,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useState } from 'react';

export default function FAQ() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      icon: FileText,
      titleAr: 'التقديم على التأشيرة',
      titleEn: 'Visa Application',
      questions: [
        {
          qAr: 'كيف يمكنني التقديم على تأشيرة؟',
          qEn: 'How can I apply for a visa?',
          aAr: 'يمكنك التقديم على التأشيرة عبر موقعنا الإلكتروني. اختر الدولة المطلوبة، ثم اتبع خطوات التقديم وقم برفع المستندات المطلوبة وأكمل عملية الدفع.',
          aEn: 'You can apply for a visa through our website. Select the desired country, follow the application steps, upload required documents, and complete the payment.'
        },
        {
          qAr: 'ما هي المستندات المطلوبة للتقديم؟',
          qEn: 'What documents are required for the application?',
          aAr: 'تختلف المستندات المطلوبة حسب نوع التأشيرة والدولة. بشكل عام، ستحتاج إلى: جواز سفر ساري، صور شخصية، كشف حساب بنكي، حجز فندقي، وتذاكر سفر.',
          aEn: 'Required documents vary by visa type and country. Generally, you will need: valid passport, personal photos, bank statement, hotel booking, and travel tickets.'
        },
        {
          qAr: 'هل يمكنني التقديم لأكثر من شخص في طلب واحد؟',
          qEn: 'Can I apply for multiple people in one application?',
          aAr: 'نعم، يمكنك التقديم لعدة أشخاص في طلب واحد. أثناء التقديم، حدد عدد المسافرين البالغين والأطفال والرضع.',
          aEn: 'Yes, you can apply for multiple people in one application. During the application, specify the number of adults, children, and infants.'
        },
      ]
    },
    {
      icon: Clock,
      titleAr: 'مدة المعالجة',
      titleEn: 'Processing Time',
      questions: [
        {
          qAr: 'كم تستغرق مدة معالجة التأشيرة؟',
          qEn: 'How long does visa processing take?',
          aAr: 'تختلف مدة المعالجة حسب نوع التأشيرة والدولة. عادةً تتراوح بين 3-15 يوم عمل. يمكنك رؤية المدة المتوقعة في صفحة كل دولة.',
          aEn: 'Processing time varies by visa type and country. Usually ranges from 3-15 business days. You can see expected duration on each country page.'
        },
        {
          qAr: 'هل يمكن تسريع معالجة الطلب؟',
          qEn: 'Can the application processing be expedited?',
          aAr: 'نعم، نوفر خدمة المعالجة السريعة لبعض التأشيرات مقابل رسوم إضافية. تواصل معنا للاستفسار عن التفاصيل.',
          aEn: 'Yes, we offer express processing for some visas for an additional fee. Contact us for details.'
        },
        {
          qAr: 'كيف يمكنني متابعة حالة طلبي؟',
          qEn: 'How can I track my application status?',
          aAr: 'يمكنك متابعة حالة طلبك من خلال صفحة "تتبع الطلب" على موقعنا باستخدام رقم الطلب ورقم جوالك أو بريدك الإلكتروني.',
          aEn: 'You can track your application status through the "Track Application" page on our website using your application number and phone or email.'
        },
      ]
    },
    {
      icon: CreditCard,
      titleAr: 'الدفع والأسعار',
      titleEn: 'Payment & Pricing',
      questions: [
        {
          qAr: 'ما هي طرق الدفع المتاحة؟',
          qEn: 'What payment methods are available?',
          aAr: 'نقبل الدفع عبر: البطاقات الائتمانية (فيزا، ماستركارد)، Apple Pay، مدى، والتحويل البنكي.',
          aEn: 'We accept: credit cards (Visa, Mastercard), Apple Pay, Mada, and bank transfer.'
        },
        {
          qAr: 'هل الأسعار شاملة رسوم التأشيرة الحكومية؟',
          qEn: 'Do prices include government visa fees?',
          aAr: 'يختلف ذلك حسب نوع التأشيرة. بعض الأسعار شاملة للرسوم الحكومية والبعض الآخر غير شامل. يتم توضيح ذلك بوضوح في صفحة كل تأشيرة.',
          aEn: 'This varies by visa type. Some prices include government fees while others do not. This is clearly indicated on each visa page.'
        },
        {
          qAr: 'هل يمكنني استرداد المبلغ إذا تم رفض التأشيرة؟',
          qEn: 'Can I get a refund if my visa is rejected?',
          aAr: 'رسوم الخدمة غير قابلة للاسترداد. أما رسوم التأشيرة الحكومية فتعتمد على سياسة كل سفارة. راجع سياسة الاسترجاع للتفاصيل.',
          aEn: 'Service fees are non-refundable. Government visa fees depend on each embassy policy. See our refund policy for details.'
        },
      ]
    },
    {
      icon: Shield,
      titleAr: 'الأمان والخصوصية',
      titleEn: 'Security & Privacy',
      questions: [
        {
          qAr: 'هل معلوماتي الشخصية آمنة؟',
          qEn: 'Is my personal information secure?',
          aAr: 'نعم، نستخدم أعلى معايير التشفير والأمان لحماية بياناتك. جميع المعلومات مشفرة ولا نشاركها مع أي طرف ثالث.',
          aEn: 'Yes, we use the highest encryption and security standards to protect your data. All information is encrypted and not shared with third parties.'
        },
        {
          qAr: 'كيف يتم التعامل مع مستنداتي؟',
          qEn: 'How are my documents handled?',
          aAr: 'يتم تخزين مستنداتك بشكل آمن ومشفر. نحتفظ بها فقط للمدة اللازمة لمعالجة طلبك ثم يتم حذفها بشكل آمن.',
          aEn: 'Your documents are stored securely and encrypted. We keep them only for the time needed to process your application, then securely delete them.'
        },
      ]
    },
    {
      icon: Globe,
      titleAr: 'عام',
      titleEn: 'General',
      questions: [
        {
          qAr: 'هل أنتم مكتب رسمي معتمد؟',
          qEn: 'Are you an officially licensed office?',
          aAr: 'نعم، نحن مكتب مرخص ومعتمد من الجهات المختصة لتقديم خدمات التأشيرات والسفر.',
          aEn: 'Yes, we are a licensed and authorized office by relevant authorities to provide visa and travel services.'
        },
        {
          qAr: 'هل يمكنني زيارة مكتبكم شخصياً؟',
          qEn: 'Can I visit your office in person?',
          aAr: 'نعم، يمكنك زيارتنا خلال ساعات العمل. موقعنا في الرياض، طريق الملك فهد، برج المملكة.',
          aEn: 'Yes, you can visit us during working hours. We are located in Riyadh, King Fahd Road, Kingdom Tower.'
        },
        {
          qAr: 'كيف يمكنني التواصل معكم؟',
          qEn: 'How can I contact you?',
          aAr: 'يمكنك التواصل معنا عبر الهاتف، البريد الإلكتروني، واتساب، أو زيارة مكتبنا. راجع صفحة "تواصل معنا" للتفاصيل.',
          aEn: 'You can contact us via phone, email, WhatsApp, or visit our office. See the "Contact Us" page for details.'
        },
      ]
    },
  ];

  // Filter FAQs based on search
  const filteredCategories = categories.map(category => ({
    ...category,
    questions: category.questions.filter(q => {
      const query = searchQuery.toLowerCase();
      const question = isRTL ? q.qAr : q.qEn;
      const answer = isRTL ? q.aAr : q.aEn;
      return question.toLowerCase().includes(query) || answer.toLowerCase().includes(query);
    })
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container-section text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            {isRTL 
              ? 'ابحث عن إجابات لأسئلتك الأكثر شيوعاً حول خدماتنا'
              : 'Find answers to the most common questions about our services'
            }
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={isRTL ? 'ابحث عن سؤال...' : 'Search for a question...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-10 py-6 text-base bg-white text-foreground"
            />
          </div>
        </div>
      </section>

      <div className="container-section py-16">
        {filteredCategories.length > 0 ? (
          <div className="space-y-8 max-w-4xl mx-auto">
            {filteredCategories.map((category, categoryIndex) => {
              const Icon = category.icon;
              return (
                <Card key={categoryIndex} className="shadow-md">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3 p-6 border-b bg-muted/30">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-xl font-semibold">
                        {isRTL ? category.titleAr : category.titleEn}
                      </h2>
                      <Badge variant="secondary" className="mr-auto">
                        {category.questions.length}
                      </Badge>
                    </div>
                    
                    <Accordion type="single" collapsible className="px-6">
                      {category.questions.map((faq, faqIndex) => (
                        <AccordionItem key={faqIndex} value={`item-${categoryIndex}-${faqIndex}`}>
                          <AccordionTrigger className="text-right hover:no-underline">
                            <span className="text-base font-medium">
                              {isRTL ? faq.qAr : faq.qEn}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground leading-relaxed">
                            {isRTL ? faq.aAr : faq.aEn}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {isRTL ? 'لم يتم العثور على نتائج' : 'No Results Found'}
            </h3>
            <p className="text-muted-foreground">
              {isRTL 
                ? 'جرب البحث بكلمات مختلفة'
                : 'Try searching with different keywords'
              }
            </p>
          </div>
        )}

        {/* Still Have Questions */}
        <Card className="mt-12 bg-primary/5 border-primary/20 max-w-4xl mx-auto">
          <CardContent className="py-8">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-right">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">
                  {isRTL ? 'لم تجد إجابة لسؤالك؟' : "Didn't Find Your Answer?"}
                </h3>
                <p className="text-muted-foreground">
                  {isRTL 
                    ? 'فريق الدعم لدينا جاهز لمساعدتك على مدار الساعة'
                    : 'Our support team is ready to help you around the clock'
                  }
                </p>
              </div>
              <div className="flex gap-3">
                <Button asChild>
                  <Link to="/contact">
                    {isRTL ? 'تواصل معنا' : 'Contact Us'}
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://wa.me/966500000000" target="_blank" rel="noopener">
                    {isRTL ? 'واتساب' : 'WhatsApp'}
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
