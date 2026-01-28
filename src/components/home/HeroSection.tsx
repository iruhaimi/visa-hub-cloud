import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, ChevronLeft, ChevronRight, Shield, Clock, CheckCircle2, Plane, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import heroBg from '@/assets/hero-bg.jpg';
// Fallback images for when database images fail
import destinationDubai from '@/assets/destination-dubai.jpg';
import destinationParis from '@/assets/destination-paris.jpg';
import destinationIstanbul from '@/assets/destination-istanbul.jpg';
import destinationLondon from '@/assets/destination-london.jpg';

interface HeroDestination {
  id: string;
  name: string;
  name_en: string | null;
  country: string;
  country_en: string | null;
  image_url: string;
  display_order: number;
  is_active: boolean;
  link_url: string | null;
}

// Fallback destinations if database is empty
const fallbackDestinations = [
  { id: '1', name: 'دبي', name_en: 'Dubai', image_url: destinationDubai, country: 'الإمارات', country_en: 'UAE', display_order: 1, is_active: true, link_url: '/destinations' },
  { id: '2', name: 'باريس', name_en: 'Paris', image_url: destinationParis, country: 'فرنسا', country_en: 'France', display_order: 2, is_active: true, link_url: '/destinations' },
  { id: '3', name: 'إسطنبول', name_en: 'Istanbul', image_url: destinationIstanbul, country: 'تركيا', country_en: 'Turkey', display_order: 3, is_active: true, link_url: '/destinations' },
  { id: '4', name: 'لندن', name_en: 'London', image_url: destinationLondon, country: 'بريطانيا', country_en: 'UK', display_order: 4, is_active: true, link_url: '/destinations' },
];

export default function HeroSection() {
  const { t, direction } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const isRTL = direction === 'rtl';

  // Fetch destinations from database
  const { data: dbDestinations, isLoading } = useQuery({
    queryKey: ['hero-destinations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_destinations')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as HeroDestination[];
    },
  });

  // Use database destinations or fallback
  const destinations = (dbDestinations && dbDestinations.length > 0) ? dbDestinations : fallbackDestinations;

  useEffect(() => {
    if (destinations.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % destinations.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [destinations.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % destinations.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + destinations.length) % destinations.length);

  // Get display name based on language
  const getDisplayName = (dest: HeroDestination) => {
    return isRTL ? dest.name : (dest.name_en || dest.name);
  };

  const getDisplayCountry = (dest: HeroDestination) => {
    return isRTL ? dest.country : (dest.country_en || dest.country);
  };

  if (destinations.length === 0 && !isLoading) {
    return null;
  }

  return (
    <section className="relative min-h-[90vh] overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroBg} 
          alt="Travel destinations" 
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      <div className="container-section relative z-10 flex flex-col min-h-[90vh] py-8">
        {/* Main Hero Content */}
        <div className="flex-1 flex flex-col lg:flex-row items-center gap-8 lg:gap-12 pt-8">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                <Plane className="h-3 w-3 ml-1" />
                عطلات رحلاتكم للسياحة والسفر
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                رحلتك تبدأ
                <span className="block text-primary mt-2">من هنا</span>
              </h1>
              
              <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
                نقدم لك خدمات التأشيرات والسفر بأعلى جودة وأفضل الأسعار. 
                احصل على تأشيرتك بكل سهولة ويسر مع فريقنا المتخصص.
              </p>

              {/* Search Box */}
              <div className="mt-8 max-w-lg mx-auto lg:mx-0">
                <div className="flex gap-2 bg-card rounded-xl p-2 shadow-lg border border-border/50">
                  <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="ابحث عن وجهتك..."
                      className="border-0 ps-10 bg-transparent focus-visible:ring-0 h-12"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button asChild size="lg" className="h-12 px-6 rounded-lg">
                    <Link to="/destinations">
                      ابحث الآن
                      <ArrowLeft className="h-4 w-4 mr-2" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-full border border-border/50">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>98% نسبة النجاح</span>
                </div>
                <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-full border border-border/50">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>+50 دولة</span>
                </div>
                <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-full border border-border/50">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>دعم متواصل</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Content - Destination Cards Slider */}
          <div className="flex-1 w-full max-w-lg lg:max-w-xl">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Main Slider */}
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0"
                    >
                      <img 
                        src={destinations[currentSlide]?.image_url} 
                        alt={getDisplayName(destinations[currentSlide])}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if image fails
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      
                      {/* Destination Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <p className="text-sm opacity-80 mb-1">{getDisplayCountry(destinations[currentSlide])}</p>
                          <h3 className="text-3xl font-bold mb-3">{getDisplayName(destinations[currentSlide])}</h3>
                          <Button asChild variant="secondary" size="sm" className="rounded-full">
                            <Link to={destinations[currentSlide]?.link_url || '/destinations'}>
                              استكشف الآن
                              <ArrowLeft className="h-4 w-4 mr-2" />
                            </Link>
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* Navigation Arrows */}
                <button
                  onClick={prevSlide}
                  className="absolute top-1/2 right-3 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute top-1/2 left-3 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
                  {destinations.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentSlide 
                          ? 'w-8 bg-white' 
                          : 'w-2 bg-white/50 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Floating Cards */}
              <div className="hidden lg:block absolute -left-12 top-1/4 bg-card rounded-xl p-4 shadow-lg border border-border/50 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">تأشيرات مُنجزة</p>
                    <p className="text-lg font-bold">+10,000</p>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block absolute -right-8 bottom-1/4 bg-card rounded-xl p-4 shadow-lg border border-border/50 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">متوسط المعالجة</p>
                    <p className="text-lg font-bold">5 أيام</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Destination Thumbnails */}
        <div className="mt-8 pb-4">
          <div className="flex items-center justify-center gap-4 overflow-x-auto pb-2">
            {destinations.map((dest, index) => (
              <button
                key={dest.id}
                onClick={() => setCurrentSlide(index)}
                className={`flex-shrink-0 group relative overflow-hidden rounded-xl transition-all ${
                  index === currentSlide 
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <img 
                  src={dest.image_url} 
                  alt={getDisplayName(dest)}
                  className="h-20 w-28 object-cover transition-transform group-hover:scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{getDisplayName(dest)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
