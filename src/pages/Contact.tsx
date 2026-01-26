import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageCircle,
  Send,
  Building2,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export default function Contact() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isRTL = language === 'ar';
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const contactInfo = [
    {
      icon: MapPin,
      titleAr: 'العنوان',
      titleEn: 'Address',
      valueAr: 'الرياض، المملكة العربية السعودية\nطريق الملك فهد، برج المملكة، الطابق 15',
      valueEn: 'Riyadh, Saudi Arabia\nKing Fahd Road, Kingdom Tower, 15th Floor'
    },
    {
      icon: Phone,
      titleAr: 'الهاتف',
      titleEn: 'Phone',
      valueAr: '+966 11 XXX XXXX\n+966 50 XXX XXXX',
      valueEn: '+966 11 XXX XXXX\n+966 50 XXX XXXX',
      link: 'tel:+966500000000'
    },
    {
      icon: Mail,
      titleAr: 'البريد الإلكتروني',
      titleEn: 'Email',
      valueAr: 'info@visago.sa\nsupport@visago.sa',
      valueEn: 'info@visago.sa\nsupport@visago.sa',
      link: 'mailto:info@visago.sa'
    },
    {
      icon: Clock,
      titleAr: 'ساعات العمل',
      titleEn: 'Working Hours',
      valueAr: 'الأحد - الخميس: 9 صباحاً - 6 مساءً\nالجمعة - السبت: مغلق',
      valueEn: 'Sun - Thu: 9 AM - 6 PM\nFri - Sat: Closed'
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    toast({
      title: isRTL ? 'تم إرسال رسالتك بنجاح' : 'Message Sent Successfully',
      description: isRTL 
        ? 'سنتواصل معك في أقرب وقت ممكن'
        : 'We will get back to you as soon as possible',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container-section text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {isRTL ? 'تواصل معنا' : 'Contact Us'}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            {isRTL 
              ? 'نحن هنا لمساعدتك. تواصل معنا في أي وقت وسنرد عليك في أسرع وقت ممكن'
              : 'We are here to help. Reach out anytime and we will respond as soon as possible'
            }
          </p>
        </div>
      </section>

      <div className="container-section py-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-4">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">
                          {isRTL ? info.titleAr : info.titleEn}
                        </h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {isRTL ? info.valueAr : info.valueEn}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* WhatsApp Card */}
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardContent className="p-5">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">
                      {isRTL ? 'واتساب' : 'WhatsApp'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {isRTL ? 'تحدث معنا مباشرة' : 'Chat with us directly'}
                    </p>
                    <Button size="sm" className="bg-green-500 hover:bg-green-600" asChild>
                      <a href="https://wa.me/966500000000" target="_blank" rel="noopener noreferrer">
                        {isRTL ? 'ابدأ المحادثة' : 'Start Chat'}
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  {isRTL ? 'أرسل لنا رسالة' : 'Send Us a Message'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {isRTL ? 'شكراً لتواصلك معنا!' : 'Thank You for Contacting Us!'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {isRTL 
                        ? 'تم استلام رسالتك وسنتواصل معك قريباً'
                        : 'Your message has been received and we will contact you soon'
                      }
                    </p>
                    <Button onClick={() => setIsSubmitted(false)}>
                      {isRTL ? 'إرسال رسالة أخرى' : 'Send Another Message'}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          {isRTL ? 'الاسم الكامل' : 'Full Name'} *
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder={isRTL ? 'أدخل اسمك' : 'Enter your name'}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">
                          {isRTL ? 'البريد الإلكتروني' : 'Email'} *
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="example@email.com"
                          dir="ltr"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          {isRTL ? 'رقم الجوال' : 'Phone Number'}
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+966 5XX XXX XXXX"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">
                          {isRTL ? 'الموضوع' : 'Subject'} *
                        </Label>
                        <Input
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder={isRTL ? 'موضوع الرسالة' : 'Message subject'}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">
                        {isRTL ? 'الرسالة' : 'Message'} *
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder={isRTL ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                        rows={5}
                        required
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {isRTL ? 'جاري الإرسال...' : 'Sending...'}
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          {isRTL ? 'إرسال الرسالة' : 'Send Message'}
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-12">
          <Card className="overflow-hidden">
            <div className="aspect-[21/9] bg-muted relative">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3624.6837453874037!2d46.6854!3d24.7114!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjTCsDQyJzQxLjAiTiA0NsKwNDEnMDcuNCJF!5e0!3m2!1sen!2ssa!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0, position: 'absolute', inset: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
