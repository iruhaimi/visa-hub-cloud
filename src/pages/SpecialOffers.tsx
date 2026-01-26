import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Percent, 
  Gift, 
  Sparkles, 
  ArrowLeft, 
  Calendar,
  Star,
  Zap,
  Timer,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SARSymbol from '@/components/ui/SARSymbol';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSpecialOffers, SpecialOffer } from '@/hooks/useSpecialOffers';

function CountdownTimer({ endDate }: { endDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div className="flex items-center gap-1 text-sm">
      <Timer className="h-4 w-4 text-destructive" />
      <div className="flex items-center gap-1 font-mono">
        <span className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-bold">
          {timeLeft.days.toString().padStart(2, '0')}
        </span>
        <span className="text-muted-foreground">:</span>
        <span className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-bold">
          {timeLeft.hours.toString().padStart(2, '0')}
        </span>
        <span className="text-muted-foreground">:</span>
        <span className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-bold">
          {timeLeft.minutes.toString().padStart(2, '0')}
        </span>
        <span className="text-muted-foreground">:</span>
        <span className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-bold">
          {timeLeft.seconds.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

function OfferCard({ offer, index }: { offer: SpecialOffer; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
        {/* Hot Badge */}
        {offer.is_hot && (
          <div className="absolute top-0 left-0 z-10">
            <div className="bg-gradient-to-r from-destructive to-warning text-destructive-foreground text-xs font-bold px-3 py-1 rounded-br-lg flex items-center gap-1">
              <Zap className="h-3 w-3" />
              عرض حار
            </div>
          </div>
        )}

        {/* Discount Badge */}
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-primary text-primary-foreground text-lg font-bold px-3 py-1">
            {offer.discount_percentage}% خصم
          </Badge>
        </div>

        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="text-4xl">{offer.flag_emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {offer.badge}
                </Badge>
                <span className="text-xs text-muted-foreground">{offer.country_name}</span>
              </div>
              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                {offer.title}
              </h3>
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
            {offer.description}
          </p>

          {/* Pricing */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-3xl font-bold text-primary">{offer.sale_price}</span>
              <SARSymbol size="md" className="text-primary" />
            </div>
            <div className="flex items-center gap-1 line-through text-muted-foreground">
              <span className="text-lg">{offer.original_price}</span>
              <SARSymbol size="xs" className="text-muted-foreground" />
            </div>
            <Badge variant="secondary" className="bg-accent/20 text-accent-foreground flex items-center gap-1">
              وفر {offer.original_price - offer.sale_price}
              <SARSymbol size="xs" />
            </Badge>
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
            <span className="text-sm text-muted-foreground">ينتهي العرض خلال:</span>
            <CountdownTimer endDate={new Date(offer.end_date)} />
          </div>

          {/* CTA */}
          <Button asChild className="w-full group/btn">
            <Link to="/apply">
              احجز الآن
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover/btn:-translate-x-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function SpecialOffers() {
  const { t } = useLanguage();
  const { data: offers, isLoading, error } = useSpecialOffers();

  // Main countdown for the biggest sale (use first offer's end date or 7 days from now)
  const mainSaleEnd = offers && offers.length > 0 
    ? new Date(offers[0].end_date) 
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Floating Elements */}
        <motion.div
          className="absolute top-32 left-10 text-4xl"
          animate={{ y: [-10, 10, -10], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          🎁
        </motion.div>
        <motion.div
          className="absolute top-20 right-32 text-3xl"
          animate={{ y: [10, -10, 10], rotate: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          ✨
        </motion.div>
        <motion.div
          className="absolute bottom-32 right-20 text-4xl"
          animate={{ y: [-5, 15, -5] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          🎉
        </motion.div>

        <div className="container-section relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <Badge className="mb-6 bg-gradient-to-r from-primary to-accent text-white text-sm px-4 py-2">
                <Sparkles className="h-4 w-4 ml-2" />
                عروض حصرية لفترة محدودة
              </Badge>
            </motion.div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              <span className="text-foreground">عروض</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                استثنائية
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              استمتع بخصومات تصل إلى 40% على خدمات التأشيرات المختارة. العروض محدودة!
            </p>

            {/* Main Countdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-block"
            >
              <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-medium">تنتهي العروض خلال</span>
                </div>
                <MainCountdown endDate={mainSaleEnd} />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-8 border-y border-border/50 bg-muted/30">
        <div className="container-section">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Percent, text: 'خصومات حتى 40%' },
              { icon: Gift, text: 'عروض حصرية' },
              { icon: Calendar, text: 'مواعيد مرنة' },
              { icon: Star, text: 'خدمة VIP' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-center gap-3 text-center"
              >
                <div className="p-2 bg-primary/10 rounded-lg">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Offers Grid */}
      <section className="py-16 sm:py-24">
        <div className="container-section">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">العروض المتاحة</h2>
            <p className="text-muted-foreground">اختر العرض المناسب لك واحجز الآن قبل انتهاء الوقت</p>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : offers && offers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer, index) => (
                <OfferCard key={offer.id} offer={offer} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">لا توجد عروض متاحة حالياً</p>
              <p className="text-sm text-muted-foreground mt-2">تابعنا للحصول على أحدث العروض</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-accent">
        <div className="container-section text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              لا تفوت الفرصة!
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              تواصل معنا الآن للحصول على عروض خاصة إضافية للمجموعات والشركات
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/contact">تواصل معنا</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                <Link to="/destinations">تصفح الوجهات</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function MainCountdown({ endDate }: { endDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const timeUnits = [
    { value: timeLeft.seconds, label: 'ثانية' },
    { value: timeLeft.minutes, label: 'دقيقة' },
    { value: timeLeft.hours, label: 'ساعة' },
    { value: timeLeft.days, label: 'يوم' },
  ];

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 flex-row-reverse">
      {timeUnits.map((unit, index) => (
        <div key={index} className="text-center">
          <motion.div
            key={unit.value}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-br from-primary to-accent text-white text-2xl sm:text-4xl font-bold w-14 sm:w-20 h-14 sm:h-20 rounded-xl flex items-center justify-center shadow-lg"
          >
            {unit.value.toString().padStart(2, '0')}
          </motion.div>
          <span className="text-xs sm:text-sm text-muted-foreground mt-2 block">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
