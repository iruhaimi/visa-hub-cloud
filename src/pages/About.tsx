import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Award, 
  Globe, 
  Shield, 
  Clock, 
  CheckCircle2,
  Target,
  Heart,
  Zap,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export default function About() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const stats = [
    { 
      value: '50,000+', 
      labelAr: 'تأشيرة تم إصدارها', 
      labelEn: 'Visas Issued' 
    },
    { 
      value: '98%', 
      labelAr: 'نسبة الموافقة', 
      labelEn: 'Approval Rate' 
    },
    { 
      value: '150+', 
      labelAr: 'دولة نخدمها', 
      labelEn: 'Countries Served' 
    },
    { 
      value: '24/7', 
      labelAr: 'دعم متواصل', 
      labelEn: 'Support Available' 
    },
  ];

  const values = [
    {
      icon: Shield,
      titleAr: 'الموثوقية',
      titleEn: 'Reliability',
      descAr: 'نلتزم بأعلى معايير الأمان والشفافية في جميع تعاملاتنا',
      descEn: 'We adhere to the highest standards of security and transparency'
    },
    {
      icon: Zap,
      titleAr: 'السرعة',
      titleEn: 'Speed',
      descAr: 'نسعى لإنجاز طلباتكم في أسرع وقت ممكن دون التضحية بالجودة',
      descEn: 'We strive to complete your applications as quickly as possible'
    },
    {
      icon: Heart,
      titleAr: 'خدمة العملاء',
      titleEn: 'Customer Service',
      descAr: 'فريقنا متاح على مدار الساعة لمساعدتكم والإجابة على استفساراتكم',
      descEn: 'Our team is available 24/7 to help and answer your questions'
    },
    {
      icon: Target,
      titleAr: 'الدقة',
      titleEn: 'Accuracy',
      descAr: 'نحرص على دقة المعلومات والمستندات لضمان الموافقة',
      descEn: 'We ensure accuracy of information and documents for approval'
    },
  ];

  const team = [
    {
      nameAr: 'أحمد الرشيد',
      nameEn: 'Ahmed Al-Rashid',
      roleAr: 'المدير التنفيذي',
      roleEn: 'CEO',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face'
    },
    {
      nameAr: 'سارة المحمود',
      nameEn: 'Sara Al-Mahmoud',
      roleAr: 'مديرة العمليات',
      roleEn: 'Operations Manager',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face'
    },
    {
      nameAr: 'خالد العتيبي',
      nameEn: 'Khaled Al-Otaibi',
      roleAr: 'رئيس قسم التأشيرات',
      roleEn: 'Visa Department Head',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container-section text-center">
          <Badge variant="secondary" className="mb-4">
            {isRTL ? 'منذ 2015' : 'Since 2015'}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {isRTL ? 'من نحن' : 'About Us'}
          </h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto leading-relaxed">
            {isRTL 
              ? 'فيزاجو هي شركة رائدة في مجال خدمات التأشيرات، نساعد المسافرين من جميع أنحاء العالم في الحصول على تأشيراتهم بسهولة وأمان'
              : 'VisaGo is a leading visa services company, helping travelers worldwide obtain their visas easily and securely'
            }
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container-section">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center border-0 shadow-lg">
                <CardContent className="pt-8 pb-6">
                  <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">
                    {isRTL ? stat.labelAr : stat.labelEn}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container-section">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">
                {isRTL ? 'قصتنا' : 'Our Story'}
              </Badge>
              <h2 className="text-3xl font-bold mb-6">
                {isRTL ? 'رحلة نجاح مستمرة' : 'A Continuous Success Journey'}
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  {isRTL 
                    ? 'بدأت فيزاجو رحلتها في عام 2015 كمكتب صغير لخدمات التأشيرات في الرياض. ومنذ ذلك الحين، نمت الشركة لتصبح واحدة من أكبر شركات خدمات التأشيرات في المنطقة.'
                    : 'VisaGo started its journey in 2015 as a small visa services office in Riyadh. Since then, the company has grown to become one of the largest visa services companies in the region.'
                  }
                </p>
                <p>
                  {isRTL
                    ? 'نفخر بفريقنا المكون من أكثر من 50 متخصصاً في التأشيرات والسفر، يعملون على مدار الساعة لضمان حصول عملائنا على أفضل خدمة ممكنة.'
                    : 'We are proud of our team of over 50 visa and travel specialists, working around the clock to ensure our clients receive the best possible service.'
                  }
                </p>
                <p>
                  {isRTL
                    ? 'هدفنا هو جعل عملية الحصول على التأشيرة سهلة وخالية من المتاعب، حتى تتمكن من التركيز على الاستمتاع برحلتك.'
                    : 'Our goal is to make the visa application process easy and hassle-free, so you can focus on enjoying your trip.'
                  }
                </p>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop"
                alt="Team"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground p-6 rounded-xl shadow-lg">
                <div className="text-3xl font-bold">10+</div>
                <div className="text-sm opacity-90">
                  {isRTL ? 'سنوات خبرة' : 'Years Experience'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="container-section">
          <div className="text-center mb-12">
            <Badge className="mb-4">
              {isRTL ? 'قيمنا' : 'Our Values'}
            </Badge>
            <h2 className="text-3xl font-bold mb-4">
              {isRTL ? 'ما يميزنا عن الآخرين' : 'What Sets Us Apart'}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-8 pb-6">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">
                      {isRTL ? value.titleAr : value.titleEn}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? value.descAr : value.descEn}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container-section">
          <div className="text-center mb-12">
            <Badge className="mb-4">
              {isRTL ? 'فريقنا' : 'Our Team'}
            </Badge>
            <h2 className="text-3xl font-bold mb-4">
              {isRTL ? 'تعرف على قيادتنا' : 'Meet Our Leadership'}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="text-center overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={isRTL ? member.nameAr : member.nameEn}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="pt-4 pb-6">
                  <h3 className="font-semibold text-lg">
                    {isRTL ? member.nameAr : member.nameEn}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? member.roleAr : member.roleEn}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container-section text-center">
          <h2 className="text-3xl font-bold mb-4">
            {isRTL ? 'جاهز لبدء رحلتك؟' : 'Ready to Start Your Journey?'}
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            {isRTL 
              ? 'تواصل معنا اليوم ودعنا نساعدك في الحصول على تأشيرتك بكل سهولة'
              : 'Contact us today and let us help you get your visa with ease'
            }
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/apply">
                {isRTL ? 'ابدأ طلبك الآن' : 'Start Your Application'}
                <ArrowIcon className="w-4 h-4 mr-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link to="/contact">
                {isRTL ? 'تواصل معنا' : 'Contact Us'}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
