import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SARSymbol from '@/components/ui/SARSymbol';
import type { Country, VisaType } from '@/types/database';

interface CountriesSectionProps {
  countries: Country[];
  visaTypes: VisaType[];
  t: (key: string) => string;
}

export default function CountriesSection({ countries, visaTypes, t }: CountriesSectionProps) {
  const getCountryMinPrice = (countryId: string) => {
    const countryVisas = visaTypes.filter(v => v.country_id === countryId);
    if (countryVisas.length === 0) return null;
    return Math.min(...countryVisas.map(v => v.price));
  };

  const getCountryProcessingDays = (countryId: string) => {
    const countryVisas = visaTypes.filter(v => v.country_id === countryId);
    if (countryVisas.length === 0) return null;
    return Math.min(...countryVisas.map(v => v.processing_days));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container-section">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            وجهات مميزة
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('countries.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('countries.subtitle')}
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {countries.slice(0, 8).map((country) => {
            const minPrice = getCountryMinPrice(country.id);
            const processingDays = getCountryProcessingDays(country.id);
            
            return (
              <motion.div
                key={country.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                {/* Flag Background */}
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={country.flag_url || `https://flagcdn.com/w320/${country.code.toLowerCase()}.png`}
                    alt={country.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                  
                  {/* Processing Badge */}
                  {processingDays && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
                      <Clock className="h-3 w-3 text-primary" />
                      <span>{processingDays} أيام</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-xl font-bold mb-2">{country.name}</h3>
                  
                  {minPrice && (
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-xs text-muted-foreground">يبدأ من</span>
                      <span className="text-2xl font-bold text-primary flex items-center gap-1">
                        {minPrice}
                        <SARSymbol size="sm" className="text-primary" />
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 rounded-lg" asChild>
                      <Link to={`/country/${country.code}`}>
                        التفاصيل
                      </Link>
                    </Button>
                    <Button size="sm" className="flex-1 rounded-lg" asChild>
                      <Link to={`/apply?country=${country.code}`}>
                        قدّم الآن
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <Button variant="outline" size="lg" className="rounded-full px-8" asChild>
            <Link to="/destinations">
              عرض جميع الوجهات
              <ArrowLeft className="h-4 w-4 mr-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
