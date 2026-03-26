import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteContent } from '@/hooks/useSiteContent';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { filterArabicChars, filterNonNumeric } from '@/lib/inputFilters';
import { 
  RotateCcw, CheckCircle2, XCircle, AlertTriangle, Clock, Mail, HelpCircle,
  ArrowRight, ArrowLeft, ChevronDown, MessageCircle, Search, Send, FileText, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export default function Refund() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isRTL = language === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    applicationNumber: '', email: '', phone: '', reason: '', additionalDetails: ''
  });
  const { data: content, isLoading } = useSiteContent('refund');

  const heroData = content?.hero || {};
  const scenariosData = content?.scenarios?.items || [];
  const feeTypesData = content?.fee_types?.items || [];
  const processStepsData = content?.process_steps?.items || [];
  const faqsData = content?.faqs?.items || [];

  const SCENARIO_ICONS = [CheckCircle2, AlertTriangle, XCircle];
  const SCENARIO_COLORS = [
    { color: 'text-green-600', bgColor: 'bg-green-100' },
    { color: 'text-amber-600', bgColor: 'bg-amber-100' },
    { color: 'text-red-600', bgColor: 'bg-red-100' },
  ];

  const refundReasons = [
    { valueAr: 'تغيير خطط السفر', valueEn: 'Change of travel plans' },
    { valueAr: 'مشكلة مالية', valueEn: 'Financial issue' },
    { valueAr: 'وجدت خدمة أفضل', valueEn: 'Found a better service' },
    { valueAr: 'تأخر في معالجة الطلب', valueEn: 'Delay in processing' },
    { valueAr: 'خطأ في الطلب', valueEn: 'Error in application' },
    { valueAr: 'سبب آخر', valueEn: 'Other reason' },
  ];

  const handleFormChange = (field: string, value: string) => {
    const processedValue = field === 'phone' ? filterNonNumeric(value) : value;
    setFormData(prev => ({ ...prev, [field]: processedValue }));
  };

  const handleEmailInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const filtered = filterArabicChars(input.value);
    if (filtered !== input.value) { input.value = filtered; setFormData(prev => ({ ...prev, email: filtered })); }
  }, []);

  const handlePhoneInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    let filtered = filterNonNumeric(input.value);
    if (filtered.length > 9) filtered = filtered.slice(0, 9);
    if (filtered !== input.value) { input.value = filtered; setFormData(prev => ({ ...prev, phone: filtered })); }
  }, []);

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicationNumber || !formData.email || !formData.reason) {
      toast({ title: isRTL ? 'خطأ' : 'Error', description: isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('refund_requests').insert({
        application_number: formData.applicationNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone?.trim() || null,
        reason: formData.reason,
        additional_details: formData.additionalDetails?.trim() || null,
        status: 'pending'
      });
      if (error) { toast({ title: isRTL ? 'خطأ' : 'Error', description: isRTL ? 'حدث خطأ أثناء إرسال الطلب.' : 'An error occurred.', variant: 'destructive' }); return; }
      toast({ title: isRTL ? 'تم إرسال الطلب بنجاح' : 'Request Submitted Successfully', description: isRTL ? 'سنراجع طلبك ونتواصل معك خلال 2-3 أيام عمل' : 'We will review your request and contact you within 2-3 business days' });
      setFormData({ applicationNumber: '', email: '', phone: '', reason: '', additionalDetails: '' });
    } catch { toast({ title: isRTL ? 'خطأ' : 'Error', description: isRTL ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.', variant: 'destructive' }); } finally { setIsSubmitting(false); }
  };

  const filteredFAQs = faqsData.filter((faq: any) => {
    if (!faqSearch.trim()) return true;
    const s = faqSearch.toLowerCase();
    const q = isRTL ? faq.question : (faq.question_en || faq.question);
    const a = isRTL ? faq.answer : (faq.answer_en || faq.answer);
    return q.toLowerCase().includes(s) || a.toLowerCase().includes(s);
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16">
          <div className="container-section text-center">
            <Skeleton className="w-16 h-16 rounded-full mx-auto mb-6" />
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
          </div>
        </section>
        <div className="container-section py-12 max-w-4xl mx-auto space-y-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container-section text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6">
            <RotateCcw className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {isRTL ? heroData.title : (heroData.title_en || heroData.title || 'سياسة الاسترجاع')}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            {isRTL ? heroData.description : (heroData.description_en || heroData.description || '')}
          </p>
        </div>
      </section>

      <div className="container-section py-12">
        <div className="max-w-4xl mx-auto">
          {/* Refund Scenarios */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">{isRTL ? 'حالات الاسترداد' : 'Refund Scenarios'}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {scenariosData.map((scenario: any, index: number) => {
                const Icon = SCENARIO_ICONS[index] || CheckCircle2;
                const colors = SCENARIO_COLORS[index] || SCENARIO_COLORS[0];
                return (
                  <Card key={index} className="text-center">
                    <CardContent className="pt-8 pb-6">
                      <div className={`w-16 h-16 ${colors.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <Icon className={`w-8 h-8 ${colors.color}`} />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{isRTL ? scenario.title : (scenario.title_en || scenario.title)}</h3>
                      <p className="text-sm text-muted-foreground">{isRTL ? scenario.description : (scenario.description_en || scenario.description)}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Fee Types */}
          {feeTypesData.length > 0 && (
            <section className="mb-12">
              <Card>
                <CardHeader><CardTitle>{isRTL ? 'أنواع الرسوم وقابلية الاسترداد' : 'Fee Types and Refundability'}</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {feeTypesData.map((fee: any, index: number) => {
                      const isRefundable = fee.is_refundable === true || fee.is_refundable === 'true';
                      return (
                        <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isRefundable ? 'bg-green-100' : 'bg-red-100'}`}>
                            {isRefundable ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{isRTL ? fee.title : (fee.title_en || fee.title)}</h4>
                            <p className="text-sm text-muted-foreground mb-1">{isRTL ? fee.description : (fee.description_en || fee.description)}</p>
                            <Badge variant={isRefundable ? 'default' : 'secondary'}>{isRTL ? fee.refundable : (fee.refundable_en || fee.refundable)}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Refund Process */}
          {processStepsData.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-center">{isRTL ? 'خطوات طلب الاسترداد' : 'Refund Request Process'}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {processStepsData.map((step: any, index: number) => (
                  <Card key={index} className="relative">
                    <CardContent className="pt-8 pb-6 text-center">
                      <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">{step.step || index + 1}</div>
                      <h4 className="font-medium mb-2">{isRTL ? step.title : (step.title_en || step.title)}</h4>
                      <p className="text-sm text-muted-foreground">{isRTL ? step.description : (step.description_en || step.description)}</p>
                    </CardContent>
                    {index < processStepsData.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -left-4 transform -translate-y-1/2">
                        <ArrowIcon className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          )}

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
                  {[
                    { ar: 'لا يمكن استرداد أي رسوم بعد تقديم الطلب للسفارة بأي حال من الأحوال', en: 'No fees can be refunded after embassy submission under any circumstances' },
                    { ar: 'في حالة رفض التأشيرة من السفارة، لا يحق للعميل استرداد أي رسوم', en: 'In case of visa rejection by the embassy, no fees are refundable' },
                    { ar: 'يتم خصم رسوم بوابة الدفع من أي مبلغ مسترد', en: 'Payment gateway fees are deducted from any refunded amount' },
                    { ar: 'طلبات الاسترداد يجب تقديمها خلال 30 يوماً من تاريخ الدفع', en: 'Refund requests must be submitted within 30 days of payment' },
                  ].map((note, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-600">•</span>
                      {isRTL ? note.ar : note.en}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Refund FAQs */}
          {faqsData.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-center">{isRTL ? 'الأسئلة الشائعة حول الاسترجاع' : 'Refund FAQs'}</h2>
              <div className="relative mb-6">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type="text" placeholder={isRTL ? 'ابحث في الأسئلة الشائعة...' : 'Search FAQs...'} value={faqSearch} onChange={(e) => setFaqSearch(e.target.value)} className="pr-10" />
              </div>
              <div className="space-y-3">
                {filteredFAQs.length === 0 ? (
                  <Card className="p-8 text-center"><p className="text-muted-foreground">{isRTL ? 'لا توجد نتائج مطابقة لبحثك' : 'No results match your search'}</p></Card>
                ) : (
                  filteredFAQs.map((faq: any, index: number) => (
                    <Card key={index} className="overflow-hidden cursor-pointer transition-all hover:shadow-md" onClick={() => setOpenFAQ(openFAQ === index ? null : index)}>
                      <CardContent className="p-0">
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">{index + 1}</div>
                            <h4 className="font-medium">{isRTL ? faq.question : (faq.question_en || faq.question)}</h4>
                          </div>
                          <motion.div animate={{ rotate: openFAQ === index ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown className="w-5 h-5 text-muted-foreground" /></motion.div>
                        </div>
                        <AnimatePresence>
                          {openFAQ === index && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                              <div className="px-4 pb-4 pt-0">
                                <div className="p-4 bg-muted/50 rounded-lg text-muted-foreground">{isRTL ? faq.answer : (faq.answer_en || faq.answer)}</div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </section>
          )}

          {/* Refund Request Form */}
          <section className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />{isRTL ? 'نموذج طلب الاسترداد' : 'Refund Request Form'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitRefund} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="applicationNumber">{isRTL ? 'رقم الطلب *' : 'Application Number *'}</Label>
                      <Input id="applicationNumber" placeholder={isRTL ? 'مثال: APP-123456' : 'e.g., APP-123456'} value={formData.applicationNumber} onChange={(e) => handleFormChange('applicationNumber', e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{isRTL ? 'البريد الإلكتروني *' : 'Email Address *'}</Label>
                      <Input id="email" type="email" inputMode="email" placeholder="example@email.com" value={formData.email} onChange={(e) => handleFormChange('email', e.target.value)} onInput={handleEmailInput} dir="ltr" style={{ textAlign: 'left' }} required />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">{isRTL ? 'رقم الهاتف' : 'Phone Number'}</Label>
                      <Input id="phone" type="tel" inputMode="numeric" maxLength={9} placeholder="5XXXXXXXX" value={formData.phone} onChange={(e) => handleFormChange('phone', e.target.value)} onInput={handlePhoneInput} dir="ltr" style={{ textAlign: 'left' }} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reason">{isRTL ? 'سبب الاسترداد *' : 'Refund Reason *'}</Label>
                      <select id="reason" className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={formData.reason} onChange={(e) => handleFormChange('reason', e.target.value)} required>
                        <option value="">{isRTL ? 'اختر السبب' : 'Select reason'}</option>
                        {refundReasons.map((reason, idx) => (<option key={idx} value={isRTL ? reason.valueAr : reason.valueEn}>{isRTL ? reason.valueAr : reason.valueEn}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="additionalDetails">{isRTL ? 'تفاصيل إضافية' : 'Additional Details'}</Label>
                    <Textarea id="additionalDetails" placeholder={isRTL ? 'أضف أي معلومات إضافية...' : 'Add any additional information...'} value={formData.additionalDetails} onChange={(e) => handleFormChange('additionalDetails', e.target.value)} rows={4} />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? (<><Loader2 className="w-4 h-4 animate-spin" />{isRTL ? 'جاري الإرسال...' : 'Submitting...'}</>) : (<><Send className="w-4 h-4" />{isRTL ? 'إرسال طلب الاسترداد' : 'Submit Refund Request'}</>)}
                    </Button>
                    <Button type="button" variant="outline" asChild><a href="mailto:info@rhalat.com"><Mail className="w-4 h-4" />{isRTL ? 'أو أرسل بريداً إلكترونياً' : 'Or Send Email'}</a></Button>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">{isRTL ? 'هل قدمت طلب استرداد مسبقاً؟' : 'Already submitted a refund request?'}</p>
                    <Link to="/track-refund" className="text-sm text-primary hover:underline font-medium">{isRTL ? 'تتبع حالة طلبك' : 'Track your request status'}</Link>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">{isRTL ? 'سنقوم بمراجعة طلبك والرد عليك خلال 2-3 أيام عمل' : 'We will review your request and respond within 2-3 business days'}</p>
                </form>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
