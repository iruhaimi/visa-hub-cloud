import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteContent } from '@/hooks/useSiteContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import CountryCodePicker from '@/components/ui/CountryCodePicker';
import { filterArabicChars, filterNonNumeric } from '@/lib/inputFilters';
import { getWhatsAppUrl } from '@/components/layout/FloatingWhatsApp';
import { 
  MapPin, Phone, Mail, Clock, MessageCircle, Send, Loader2, CheckCircle2, Headphones, Globe
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  MapPin, Phone, Mail, Clock, MessageCircle, Globe, Headphones,
};

export default function Contact() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isRTL = language === 'ar';
  const { data: content, isLoading } = useSiteContent('contact');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', countryCode: '+966', phone: '', subject: '', message: ''
  });

  const heroData = content?.hero || {};
  const infoItems = content?.info?.items || [];
  const whatsappData = content?.whatsapp || {};

  const contactInfo = infoItems.map((item: any) => ({
    icon: ICON_MAP[item.icon] || MapPin,
    title: isRTL ? item.title : (item.title_en || item.title),
    value: isRTL ? item.value : (item.value_en || item.value),
    link: item.link || undefined,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast({
      title: isRTL ? 'تم إرسال رسالتك بنجاح' : 'Message Sent Successfully',
      description: isRTL ? 'سنتواصل معك في أقرب وقت ممكن' : 'We will get back to you as soon as possible',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'phone' ? filterNonNumeric(value) : value;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleEmailInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const filtered = filterArabicChars(input.value);
    if (filtered !== input.value) {
      input.value = filtered;
      setFormData(prev => ({ ...prev, email: filtered }));
    }
  }, []);

  const handlePhoneInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    let filtered = filterNonNumeric(input.value);
    if (filtered.length > 9) filtered = filtered.slice(0, 9);
    if (filtered !== input.value) {
      input.value = filtered;
      setFormData(prev => ({ ...prev, phone: filtered }));
    }
  }, []);

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <section className="bg-gradient-to-br from-primary via-primary/95 to-primary/85 py-20">
          <div className="container-section text-center">
            <Skeleton className="w-20 h-20 rounded-full mx-auto mb-6" />
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
          </div>
        </section>
        <div className="container-section py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const waNumber = whatsappData.number || '966562525665';
  const waMessage = whatsappData.message || 'السلام عليكم';
  const waBtnText = isRTL ? (whatsappData.button_text || 'ابدأ المحادثة') : (whatsappData.button_text_en || whatsappData.button_text || 'Start Chat');
  const whatsappUrl = getWhatsAppUrl(waMessage, waNumber);

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
              <Headphones className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {isRTL ? heroData.title : (heroData.title_en || heroData.title || 'تواصل معنا')}
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              {isRTL ? heroData.description : (heroData.description_en || heroData.description || '')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Contact Cards */}
      <section className="py-8 -mt-8 relative z-10">
        <div className="container-section">
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" variants={containerVariants} initial="hidden" animate="visible">
            {contactInfo.map((info: any, index: number) => {
              const Icon = info.icon;
              return (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer h-full">
                    <CardContent className="p-5 text-center">
                      <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-6 h-6 text-primary" />
                      </motion.div>
                      <h3 className="font-semibold mb-1 text-sm">{info.title}</h3>
                      <p className="text-xs text-muted-foreground">{info.value}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <div className="container-section py-12">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Contact Methods */}
          <motion.div className="lg:col-span-2 space-y-4" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            {/* WhatsApp Card */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200/50 dark:border-green-800/50 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <motion.div whileHover={{ scale: 1.1 }} className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{isRTL ? 'واتساب' : 'WhatsApp'}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{isRTL ? 'تحدث معنا مباشرة وسنرد فوراً' : 'Chat with us directly'}</p>
                    <Button className="bg-green-500 hover:bg-green-600 rounded-xl w-full" asChild>
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="w-4 h-4 ml-2" />
                        {waBtnText}
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phone Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <motion.div whileHover={{ scale: 1.1 }} className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                    <Phone className="w-7 h-7 text-primary-foreground" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{isRTL ? 'اتصل بنا' : 'Call Us'}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{isRTL ? 'متاحون من ١٠ ص - ١٠ م' : 'Available 10 AM - 10 PM'}</p>
                    <Button variant="outline" className="rounded-xl w-full" asChild>
                      <a href="tel:920034158"><Phone className="w-4 h-4 ml-2" />920034158</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Card */}
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <motion.div whileHover={{ scale: 1.1 }} className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center">
                    <Mail className="w-7 h-7 text-muted-foreground" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{isRTL ? 'البريد الإلكتروني' : 'Email Us'}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{isRTL ? 'نرد خلال 24 ساعة' : 'We reply within 24 hours'}</p>
                    <Button variant="outline" className="rounded-xl w-full" asChild>
                      <a href="mailto:info@rhalat.com"><Mail className="w-4 h-4 ml-2" />info@rhalat.com</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Form */}
          <motion.div className="lg:col-span-3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card className="shadow-2xl border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><Send className="w-5 h-5 text-primary" /></div>
                  {isRTL ? 'أرسل لنا رسالة' : 'Send Us a Message'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isSubmitted ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-2">{isRTL ? 'شكراً لتواصلك معنا!' : 'Thank You for Contacting Us!'}</h3>
                    <p className="text-muted-foreground mb-6">{isRTL ? 'تم استلام رسالتك وسنتواصل معك قريباً' : 'Your message has been received and we will contact you soon'}</p>
                    <Button onClick={() => setIsSubmitted(false)} className="rounded-xl">{isRTL ? 'إرسال رسالة أخرى' : 'Send Another Message'}</Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{isRTL ? 'الاسم الكامل' : 'Full Name'} *</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder={isRTL ? 'أدخل اسمك' : 'Enter your name'} className="rounded-xl" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{isRTL ? 'البريد الإلكتروني' : 'Email'} *</Label>
                        <Input id="email" name="email" type="email" inputMode="email" value={formData.email} onChange={handleChange} onInput={handleEmailInput} placeholder="example@email.com" className="rounded-xl text-left" dir="ltr" style={{ textAlign: 'left' }} required />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">{isRTL ? 'رقم الجوال' : 'Phone Number'}</Label>
                        <div className="flex flex-row-reverse gap-2">
                          <CountryCodePicker value={formData.countryCode} onChange={(value) => setFormData(prev => ({ ...prev, countryCode: value }))} isRTL={isRTL} />
                          <Input id="phone" name="phone" type="tel" inputMode="numeric" maxLength={9} value={formData.phone} onChange={handleChange} onInput={handlePhoneInput} placeholder="5XXXXXXXX" className="rounded-xl flex-1 text-left" dir="ltr" style={{ textAlign: 'left' }} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">{isRTL ? 'الموضوع' : 'Subject'} *</Label>
                        <Input id="subject" name="subject" value={formData.subject} onChange={handleChange} placeholder={isRTL ? 'موضوع الرسالة' : 'Message subject'} className="rounded-xl" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">{isRTL ? 'الرسالة' : 'Message'} *</Label>
                      <Textarea id="message" name="message" value={formData.message} onChange={handleChange} placeholder={isRTL ? 'اكتب رسالتك هنا...' : 'Write your message here...'} className="rounded-xl min-h-[120px]" required />
                    </div>
                    <Button type="submit" className="w-full rounded-xl py-6 text-base" disabled={isSubmitting}>
                      {isSubmitting ? (<><Loader2 className="w-5 h-5 animate-spin ml-2" />{isRTL ? 'جاري الإرسال...' : 'Sending...'}</>) : (<><Send className="w-5 h-5 ml-2" />{isRTL ? 'إرسال الرسالة' : 'Send Message'}</>)}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Map Section */}
      <section className="py-12 bg-muted/30">
        <div className="container-section">
          <Card className="overflow-hidden border-0 shadow-xl">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3623.7!2d46.6753!3d24.7136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjTCsDQyJzQ5LjAiTiA0NsKwNDAnMzEuMSJF!5e0!3m2!1sar!2ssa!4v1"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={isRTL ? 'موقعنا على الخريطة' : 'Our Location'}
            />
          </Card>
        </div>
      </section>
    </div>
  );
}
