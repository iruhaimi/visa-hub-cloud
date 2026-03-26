import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteContent } from '@/hooks/useSiteContent';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { 
  Building2, Users, Award, Globe, Shield, Clock, CheckCircle2,
  Target, Heart, Zap, ArrowLeft, ArrowRight, Sparkles
} from 'lucide-react';

const ICON_MAP: Record<string, any> = { Award, CheckCircle2, Globe, Clock, Shield, Zap, Heart, Target };

export default function About() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const { data: content, isLoading } = useSiteContent('about');

  const hero = content?.hero || {};
  const stats = content?.stats || {};
  const story = content?.story || {};
  const values = content?.values || {};
  const team = content?.team || {};
  const cta = content?.cta || {};

  const t = (ar: string, en: string, obj?: any, key?: string) => {
    if (obj && key) return isRTL ? (obj[key] || ar) : (obj[key + '_en'] || en);
    return isRTL ? ar : en;
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-primary py-24"><div className="container-section text-center"><Skeleton className="h-12 w-64 mx-auto mb-4 bg-white/20" /><Skeleton className="h-6 w-96 mx-auto bg-white/10" /></div></div>
        <div className="container-section py-16"><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-40" />)}</div></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/85 py-24 overflow-hidden">
        <div className="absolute inset-0">
          <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-3xl blur-xl" />
          <motion.div animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }} transition={{ duration: 10, repeat: Infinity, delay: 1 }} className="absolute bottom-20 left-20 w-40 h-40 bg-white/10 rounded-full blur-xl" />
        </div>
        <div className="container-section relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}>
              <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
                <Sparkles className="w-4 h-4 ml-1" />
                {t(hero.badge || 'منذ 2015', hero.badge_en || 'Since 2015')}
              </Badge>
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">{t(hero.title || 'من نحن', hero.title_en || 'About Us')}</h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">{t(hero.description || '', hero.description_en || '')}</p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 -mt-12 relative z-10">
        <div className="container-section">
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {(stats.items || []).map((stat: any, index: number) => {
              const Icon = ICON_MAP[stat.icon] || Award;
              return (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="text-center border-0 shadow-xl bg-card hover:shadow-2xl transition-shadow">
                    <CardContent className="pt-8 pb-6">
                      <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.1, type: "spring" }} className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-7 h-7 text-primary" />
                      </motion.div>
                      <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                      <div className="text-muted-foreground">{t(stat.label, stat.label_en)}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="container-section">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <Badge className="mb-4">{t(story.badge || 'قصتنا', story.badge_en || 'Our Story')}</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t(story.title || '', story.title_en || '')}</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                {(isRTL ? story.paragraphs : story.paragraphs_en || story.paragraphs || []).map((p: string, i: number) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </motion.div>
            <motion.div className="relative" initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img src={story.image || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop'} alt="Team" className="w-full h-auto" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent" />
              </div>
              <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3, type: "spring" }} className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground p-6 rounded-2xl shadow-xl">
                <div className="text-4xl font-bold">{story.years_value || '10+'}</div>
                <div className="text-sm opacity-90">{t(story.years_label || 'سنوات خبرة', story.years_label_en || 'Years Experience')}</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/30">
        <div className="container-section">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Badge className="mb-4">{t(values.badge || 'قيمنا', values.badge_en || 'Our Values')}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t(values.title || '', values.title_en || '')}</h2>
          </motion.div>
          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {(values.items || []).map((value: any, index: number) => {
              const Icon = ICON_MAP[value.icon] || Shield;
              return (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="text-center h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="pt-8 pb-6">
                      <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors">
                        <Icon className="w-8 h-8 text-primary" />
                      </motion.div>
                      <h3 className="font-bold text-lg mb-2">{t(value.title, value.title_en)}</h3>
                      <p className="text-sm text-muted-foreground">{t(value.description, value.description_en)}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="container-section">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Badge className="mb-4">{t(team.badge || 'فريقنا', team.badge_en || 'Our Team')}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t(team.title || '', team.title_en || '')}</h2>
          </motion.div>
          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {(team.members || []).map((member: any, index: number) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="text-center overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className="aspect-square overflow-hidden relative">
                    <img src={member.image} alt={t(member.name, member.name_en)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardContent className="pt-4 pb-6 relative">
                    <h3 className="font-bold text-lg">{t(member.name, member.name_en)}</h3>
                    <p className="text-sm text-primary">{t(member.role, member.role_en)}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-10 left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        </div>
        <div className="container-section relative">
          <motion.div className="text-center" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t(cta.title || '', cta.title_en || '')}</h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">{t(cta.description || '', cta.description_en || '')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" className="rounded-xl" asChild>
                <Link to="/apply">
                  {t(cta.primary_button || 'ابدأ طلبك الآن', cta.primary_button_en || 'Start Your Application')}
                  <ArrowIcon className="w-4 h-4 mr-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl border-white text-white hover:bg-white/10" asChild>
                <Link to="/contact">{t(cta.secondary_button || 'تواصل معنا', cta.secondary_button_en || 'Contact Us')}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
