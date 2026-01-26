import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

const testimonials = [
  {
    name: 'أحمد محمد',
    role: 'رجل أعمال',
    content: 'خدمة ممتازة وسريعة. حصلت على تأشيرة شنغن في 5 أيام فقط! فريق محترف ومتابعة مستمرة.',
    rating: 5,
    avatar: 'أ',
  },
  {
    name: 'سارة العلي',
    role: 'طالبة',
    content: 'فريق محترف ساعدني في الحصول على تأشيرة الدراسة بكل سهولة. أنصح الجميع بالتعامل معهم.',
    rating: 5,
    avatar: 'س',
  },
  {
    name: 'خالد الأحمد',
    role: 'سائح',
    content: 'أفضل خدمة تأشيرات استخدمتها. متابعة مستمرة وتواصل ممتاز. سأتعامل معهم دائماً.',
    rating: 5,
    avatar: 'خ',
  },
  {
    name: 'نورة السعيد',
    role: 'موظفة',
    content: 'تجربة رائعة من البداية للنهاية. الأسعار مناسبة والخدمة سريعة ومحترفة.',
    rating: 5,
    avatar: 'ن',
  },
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const next = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-muted/50 to-background overflow-hidden">
      <div className="container-section">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            آراء العملاء
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ماذا يقول عملاؤنا
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            انضم لآلاف العملاء السعداء الذين وثقوا بنا
          </p>
        </motion.div>

        {/* Main Testimonial Card */}
        <div className="max-w-4xl mx-auto relative">
          <div className="relative bg-card rounded-3xl p-8 md:p-12 shadow-xl border border-border/50">
            {/* Quote Icon */}
            <div className="absolute -top-6 right-8">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <Quote className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="pt-4"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: testimonials[currentIndex].rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-xl md:text-2xl font-medium leading-relaxed mb-8">
                  "{testimonials[currentIndex].content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                    {testimonials[currentIndex].avatar}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{testimonials[currentIndex].name}</p>
                    <p className="text-muted-foreground">{testimonials[currentIndex].role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="absolute bottom-8 left-8 flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={prev}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={next}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(index);
                }}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'w-8 bg-primary' 
                    : 'w-2 bg-primary/30 hover:bg-primary/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <motion.div 
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {[
            { value: '+10,000', label: 'تأشيرة مُنجزة' },
            { value: '98%', label: 'نسبة الرضا' },
            { value: '+50', label: 'دولة نخدمها' },
            { value: '24/7', label: 'دعم متواصل' },
          ].map((stat, index) => (
            <div key={index} className="text-center p-6 rounded-2xl bg-card border border-border/50">
              <p className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</p>
              <p className="text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
