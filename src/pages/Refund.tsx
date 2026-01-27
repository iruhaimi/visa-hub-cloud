import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  RotateCcw, 
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Mail,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Refund() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const refundScenarios = [
    {
      status: 'full',
      titleAr: 'استرداد كامل',
      titleEn: 'Full Refund',
      descAr: 'إلغاء الطلب خلال 24 ساعة من الدفع وقبل البدء بالمعالجة',
      descEn: 'Cancellation within 24 hours of payment and before processing begins',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      status: 'partial',
      titleAr: 'استرداد جزئي (75%)',
      titleEn: 'Partial Refund (75%)',
      descAr: 'إلغاء الطلب بعد 24 ساعة وقبل تقديمه للسفارة',
      descEn: 'Cancellation after 24 hours but before embassy submission',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      status: 'none',
      titleAr: 'لا استرداد',
      titleEn: 'No Refund',
      descAr: 'بعد تقديم الطلب للسفارة أو في حالة رفض التأشيرة',
      descEn: 'After embassy submission or in case of visa rejection',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  const feeTypes = [
    {
      titleAr: 'رسوم الخدمة',
      titleEn: 'Service Fees',
      descAr: 'رسوم معالجة الطلب ومراجعة المستندات',
      descEn: 'Application processing and document review fees',
      refundableAr: 'قابلة للاسترداد وفق الشروط أعلاه',
      refundableEn: 'Refundable according to conditions above',
      isRefundable: true,
    },
    {
      titleAr: 'رسوم الموعد',
      titleEn: 'Appointment Fees',
      descAr: 'رسوم حجز موعد السفارة أو مركز التأشيرات',
      descEn: 'Embassy or visa center appointment booking fees',
      refundableAr: 'غير قابلة للاسترداد بعد حجز الموعد',
      refundableEn: 'Non-refundable once appointment is booked',
      isRefundable: false,
    },
    {
      titleAr: 'رسوم التأشيرة الحكومية',
      titleEn: 'Government Visa Fees',
      descAr: 'الرسوم المدفوعة للسفارة أو القنصلية',
      descEn: 'Fees paid to embassy or consulate',
      refundableAr: 'غير قابلة للاسترداد بعد دفعها للسفارة',
      refundableEn: 'Non-refundable once paid to embassy',
      isRefundable: false,
    },
    {
      titleAr: 'رسوم البريد السريع',
      titleEn: 'Express Shipping Fees',
      descAr: 'رسوم شحن المستندات',
      descEn: 'Document shipping fees',
      refundableAr: 'غير قابلة للاسترداد بعد الشحن',
      refundableEn: 'Non-refundable once shipped',
      isRefundable: false,
    },
    {
      titleAr: 'رسوم التأمين الصحي',
      titleEn: 'Health Insurance Fees',
      descAr: 'رسوم التأمين الصحي للسفر المطلوب لبعض الدول',
      descEn: 'Travel health insurance required for some countries',
      refundableAr: 'غير قابلة للاسترداد بعد إصدار الوثيقة',
      refundableEn: 'Non-refundable once policy is issued',
      isRefundable: false,
    },
  ];

  const refundFAQs = [
    {
      questionAr: 'كم يستغرق استرداد المبلغ؟',
      questionEn: 'How long does a refund take?',
      answerAr: 'يتم معالجة طلبات الاسترداد خلال 2-3 أيام عمل، ويصل المبلغ إلى حسابك خلال 7-14 يوم عمل حسب البنك.',
      answerEn: 'Refund requests are processed within 2-3 business days, and the amount reaches your account within 7-14 business days depending on your bank.',
    },
    {
      questionAr: 'هل يمكنني استرداد المبلغ إذا رُفضت تأشيرتي؟',
      questionEn: 'Can I get a refund if my visa is rejected?',
      answerAr: 'للأسف لا، رفض التأشيرة من السفارة لا يخولك للاسترداد لأن الرسوم تُدفع مقابل الخدمة المقدمة وليس مقابل نتيجة الطلب.',
      answerEn: 'Unfortunately no, visa rejection by the embassy does not entitle you to a refund as fees are paid for the service provided, not the application outcome.',
    },
    {
      questionAr: 'ماذا يحدث إذا ألغيت موعدي في السفارة؟',
      questionEn: 'What happens if I cancel my embassy appointment?',
      answerAr: 'رسوم الموعد غير قابلة للاسترداد بعد حجز الموعد، لكن قد نتمكن من إعادة جدولة الموعد إذا كان ذلك متاحاً.',
      answerEn: 'Appointment fees are non-refundable once booked, but we may be able to reschedule if available.',
    },
    {
      questionAr: 'كيف أطلب استرداد المبلغ؟',
      questionEn: 'How do I request a refund?',
      answerAr: 'أرسل بريداً إلكترونياً إلى info@rhalat.com يتضمن رقم طلبك، سبب الاسترداد، وتفاصيل الدفع.',
      answerEn: 'Send an email to info@rhalat.com with your application number, refund reason, and payment details.',
    },
    {
      questionAr: 'هل يمكنني الحصول على استرداد جزئي؟',
      questionEn: 'Can I get a partial refund?',
      answerAr: 'نعم، إذا ألغيت بعد 24 ساعة وقبل تقديم الطلب للسفارة، يمكنك الحصول على استرداد 75% من رسوم الخدمة.',
      answerEn: 'Yes, if you cancel after 24 hours but before embassy submission, you can get a 75% refund of service fees.',
    },
  ];

  const processSteps = [
    {
      stepAr: '1',
      titleAr: 'تقديم الطلب',
      titleEn: 'Submit Request',
      descAr: 'أرسل طلب الاسترداد عبر البريد الإلكتروني مع رقم الطلب',
      descEn: 'Send refund request via email with application number',
    },
    {
      stepAr: '2',
      titleAr: 'المراجعة',
      titleEn: 'Review',
      descAr: 'سنراجع طلبك خلال 2-3 أيام عمل',
      descEn: 'We will review your request within 2-3 business days',
    },
    {
      stepAr: '3',
      titleAr: 'الإشعار',
      titleEn: 'Notification',
      descAr: 'ستتلقى إشعاراً بالموافقة أو الرفض مع السبب',
      descEn: 'You will receive approval or rejection notification with reason',
    },
    {
      stepAr: '4',
      titleAr: 'الاسترداد',
      titleEn: 'Refund',
      descAr: 'سيتم إرجاع المبلغ خلال 7-14 يوم عمل',
      descEn: 'Amount will be refunded within 7-14 business days',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container-section text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6">
            <RotateCcw className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {isRTL ? 'سياسة الاسترجاع' : 'Refund Policy'}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            {isRTL 
              ? 'نؤمن بالشفافية الكاملة. تعرف على سياسة الاسترجاع وشروطها'
              : 'We believe in complete transparency. Learn about our refund policy and conditions'
            }
          </p>
        </div>
      </section>

      <div className="container-section py-12">
        <div className="max-w-4xl mx-auto">
          {/* Refund Scenarios */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">
              {isRTL ? 'حالات الاسترداد' : 'Refund Scenarios'}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {refundScenarios.map((scenario, index) => {
                const Icon = scenario.icon;
                return (
                  <Card key={index} className="text-center">
                    <CardContent className="pt-8 pb-6">
                      <div className={`w-16 h-16 ${scenario.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <Icon className={`w-8 h-8 ${scenario.color}`} />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">
                        {isRTL ? scenario.titleAr : scenario.titleEn}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? scenario.descAr : scenario.descEn}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Fee Types */}
          <section className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle>
                  {isRTL ? 'أنواع الرسوم وقابلية الاسترداد' : 'Fee Types and Refundability'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feeTypes.map((fee, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-4 p-4 rounded-lg bg-muted/50"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        fee.isRefundable ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {fee.isRefundable ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">
                          {isRTL ? fee.titleAr : fee.titleEn}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-1">
                          {isRTL ? fee.descAr : fee.descEn}
                        </p>
                        <Badge variant={fee.isRefundable ? 'default' : 'secondary'}>
                          {isRTL ? fee.refundableAr : fee.refundableEn}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Refund Process */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">
              {isRTL ? 'خطوات طلب الاسترداد' : 'Refund Request Process'}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {processSteps.map((step, index) => (
                <Card key={index} className="relative">
                  <CardContent className="pt-8 pb-6 text-center">
                    <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                      {step.stepAr}
                    </div>
                    <h4 className="font-medium mb-2">
                      {isRTL ? step.titleAr : step.titleEn}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? step.descAr : step.descEn}
                    </p>
                  </CardContent>
                  {index < processSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -left-4 transform -translate-y-1/2">
                      <ArrowIcon className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </section>

          {/* Important Notes */}
          <section className="mb-12">
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="w-5 h-5" />
                  {isRTL ? 'ملاحظات مهمة' : 'Important Notes'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-amber-900 dark:text-amber-100">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    {isRTL 
                      ? 'لا يمكن استرداد أي رسوم بعد تقديم الطلب للسفارة بأي حال من الأحوال'
                      : 'No fees can be refunded after embassy submission under any circumstances'
                    }
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    {isRTL 
                      ? 'في حالة رفض التأشيرة من السفارة، لا يحق للعميل استرداد أي رسوم'
                      : 'In case of visa rejection by the embassy, no fees are refundable'
                    }
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    {isRTL 
                      ? 'يتم خصم رسوم بوابة الدفع من أي مبلغ مسترد'
                      : 'Payment gateway fees are deducted from any refunded amount'
                    }
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    {isRTL 
                      ? 'طلبات الاسترداد يجب تقديمها خلال 30 يوماً من تاريخ الدفع'
                      : 'Refund requests must be submitted within 30 days of payment'
                    }
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Refund FAQs Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">
              {isRTL ? 'الأسئلة الشائعة حول الاسترجاع' : 'Refund FAQs'}
            </h2>
            <div className="space-y-3">
              {refundFAQs.map((faq, index) => (
                <Card 
                  key={index} 
                  className="overflow-hidden cursor-pointer transition-all hover:shadow-md"
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                          {index + 1}
                        </div>
                        <h4 className="font-medium">
                          {isRTL ? faq.questionAr : faq.questionEn}
                        </h4>
                      </div>
                      <motion.div
                        animate={{ rotate: openFAQ === index ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      </motion.div>
                    </div>
                    <AnimatePresence>
                      {openFAQ === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0">
                            <div className="p-4 bg-muted/50 rounded-lg text-muted-foreground">
                              {isRTL ? faq.answerAr : faq.answerEn}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Contact for Refund */}
          <section>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-8">
                <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-right">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      {isRTL ? 'لطلب استرداد' : 'To Request a Refund'}
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      {isRTL 
                        ? 'أرسل بريداً إلكترونياً يتضمن رقم الطلب وسبب الاسترداد إلى:'
                        : 'Send an email with your application number and refund reason to:'
                      }
                    </p>
                    <a 
                      href="mailto:info@rhalat.com" 
                      className="text-primary font-medium hover:underline"
                    >
                      info@rhalat.com
                    </a>
                  </div>
                  <div className="flex gap-3">
                    <Button asChild>
                      <a href="mailto:info@rhalat.com">
                        {isRTL ? 'طلب استرداد' : 'Request Refund'}
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/faq">
                        <HelpCircle className="w-4 h-4" />
                        {isRTL ? 'الأسئلة الشائعة' : 'FAQ'}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
