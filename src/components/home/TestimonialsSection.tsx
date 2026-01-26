import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const testimonials = [
  {
    name: 'أحمد محمد',
    role: 'رجل أعمال',
    content: 'خدمة ممتازة وسريعة. حصلت على تأشيرة شنغن في 5 أيام فقط! فريق محترف ومتابعة مستمرة.',
    rating: 5,
    avatar: 'أ',
    country: '🇸🇦',
    visa: 'شنغن',
  },
  {
    name: 'سارة العلي',
    role: 'طالبة',
    content: 'فريق محترف ساعدني في الحصول على تأشيرة الدراسة بكل سهولة. أنصح الجميع بالتعامل معهم.',
    rating: 5,
    avatar: 'س',
    country: '🇸🇦',
    visa: 'بريطانيا',
  },
  {
    name: 'خالد الأحمد',
    role: 'سائح',
    content: 'أفضل خدمة تأشيرات استخدمتها. متابعة مستمرة وتواصل ممتاز. سأتعامل معهم دائماً.',
    rating: 5,
    avatar: 'خ',
    country: '🇸🇦',
    visa: 'تركيا',
  },
  {
    name: 'نورة السعيد',
    role: 'موظفة',
    content: 'تجربة رائعة من البداية للنهاية. الأسعار مناسبة والخدمة سريعة ومحترفة.',
    rating: 5,
    avatar: 'ن',
    country: '🇸🇦',
    visa: 'دبي',
  },
  {
    name: 'محمد الحربي',
    role: 'مهندس',
    content: 'سهولة في التقديم ومتابعة دقيقة للطلب. حصلت على التأشيرة قبل الموعد المتوقع!',
    rating: 5,
    avatar: 'م',
    country: '🇸🇦',
    visa: 'أمريكا',
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
    <section className="py-24 bg-gradient-to-b from-background via-muted/20 to-background overflow-hidden relative">
      {/* Decorative Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container-section relative">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
          >
            <MessageSquare className="h-4 w-4" />
            <span>آراء العملاء</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            ماذا يقول عملاؤنا
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            انضم لآلاف العملاء السعداء الذين وثقوا بنا
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Main Testimonial Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative bg-card rounded-3xl p-8 md:p-10 shadow-2xl border border-border/50">
              {/* Quote Icon */}
              <div className="absolute -top-6 right-8">
                <motion.div 
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Quote className="h-7 w-7 text-primary-foreground" />
                </motion.div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="pt-6"
                >
                  {/* Visa Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent-foreground text-xs font-medium mb-4">
                    <span>تأشيرة {testimonials[currentIndex].visa}</span>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: testimonials[currentIndex].rating }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Star className="h-5 w-5 fill-warning text-warning" />
                      </motion.div>
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-xl md:text-2xl font-medium leading-relaxed mb-8 text-foreground">
                    "{testimonials[currentIndex].content}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-xl font-bold">
                          {testimonials[currentIndex].avatar}
                        </div>
                        <div className="absolute -bottom-1 -right-1 text-lg">
                          {testimonials[currentIndex].country}
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-lg">{testimonials[currentIndex].name}</p>
                        <p className="text-muted-foreground">{testimonials[currentIndex].role}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="absolute bottom-8 left-8 flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={prev}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
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
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'w-8 bg-primary' 
                      : 'w-2 bg-primary/30 hover:bg-primary/50'
                  }`}
                />
              ))}
            </div>
          </motion.div>

          {/* Side Testimonials Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:grid grid-cols-1 gap-4"
          >
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(index);
                }}
                className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-primary/5 border-primary/30 shadow-lg'
                    : 'bg-card border-border/50 hover:border-primary/20 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/80 to-primary/50 flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                    {testimonial.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold">{testimonial.name}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-warning text-warning" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {testimonial.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* View All Reviews */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 text-center">
              <p className="text-3xl font-bold text-primary mb-1">+10,000</p>
              <p className="text-sm text-muted-foreground">تقييم إيجابي من عملائنا</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
