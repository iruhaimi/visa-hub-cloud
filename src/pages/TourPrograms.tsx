import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Search, MapPin, Clock, Users, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Program {
  id: string;
  title: string;
  title_en: string | null;
  destination: string;
  destination_en: string | null;
  cover_image_url: string | null;
  duration_days: number;
  duration_nights: number;
  price: number;
  discounted_price: number | null;
  discount_percentage: number | null;
  max_seats: number | null;
  seats_booked: number;
  start_date: string | null;
  tags: any;
  tour_operators: {
    company_name: string;
    company_name_en: string | null;
    logo_url: string | null;
    is_verified: boolean;
  } | null;
}

export default function TourPrograms() {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPrograms = async () => {
      const { data, error } = await supabase
        .from('tour_programs')
        .select('id, title, title_en, destination, destination_en, cover_image_url, duration_days, duration_nights, price, discounted_price, discount_percentage, max_seats, seats_booked, start_date, tags, tour_operators:operator_id(company_name, company_name_en, logo_url, is_verified)')
        .eq('status', 'approved')
        .order('display_order', { ascending: true });

      if (!error) setPrograms((data as any) || []);
      setLoading(false);
    };

    fetchPrograms();
  }, []);

  const filtered = programs.filter(p => {
    const q = search.toLowerCase();
    return !q || p.title.toLowerCase().includes(q) || p.destination.toLowerCase().includes(q) || 
      (p.title_en && p.title_en.toLowerCase().includes(q)) || (p.destination_en && p.destination_en.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-8 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold">
          {isEn ? 'Tourism Programs' : 'البرامج السياحية'}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {isEn ? 'Discover unique travel experiences from our trusted partners' : 'اكتشف تجارب سفر مميزة من شركائنا الموثوقين'}
        </p>
      </div>

      <div className="max-w-md mx-auto relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isEn ? 'Search programs...' : 'ابحث عن برنامج...'}
          className="pr-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{isEn ? 'No programs found' : 'لا توجد برامج حالياً'}</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((program) => (
            <Link key={program.id} to={`/tour-programs/${program.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer h-full">
                <div className="relative h-48 overflow-hidden">
                  {program.cover_image_url ? (
                    <img
                      src={program.cover_image_url}
                      alt={isEn ? program.title_en || program.title : program.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-primary/30" />
                    </div>
                  )}
                  {program.discount_percentage && (
                    <Badge className="absolute top-3 left-3 bg-destructive">
                      خصم {program.discount_percentage}%
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg line-clamp-1">
                      {isEn ? program.title_en || program.title : program.title}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      {isEn ? program.destination_en || program.destination : program.destination}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {program.duration_days} {isEn ? 'days' : 'أيام'} / {program.duration_nights} {isEn ? 'nights' : 'ليالي'}
                    </span>
                    {program.max_seats && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {program.max_seats - program.seats_booked} {isEn ? 'seats left' : 'متبقي'}
                      </span>
                    )}
                  </div>

                  {program.tour_operators && (
                    <div className="flex items-center gap-2 text-sm">
                      {program.tour_operators.logo_url ? (
                        <img src={program.tour_operators.logo_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                      ) : null}
                      <span className="text-muted-foreground">
                        {isEn ? program.tour_operators.company_name_en || program.tour_operators.company_name : program.tour_operators.company_name}
                      </span>
                      {program.tour_operators.is_verified && (
                        <Badge variant="outline" className="text-xs">✓ {isEn ? 'Verified' : 'موثق'}</Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      {program.discounted_price ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">{program.discounted_price.toLocaleString()} {isEn ? 'SAR' : 'ر.س'}</span>
                          <span className="text-sm line-through text-muted-foreground">{program.price.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-primary">{program.price.toLocaleString()} {isEn ? 'SAR' : 'ر.س'}</span>
                      )}
                    </div>
                    <Button size="sm" variant="outline">
                      {isEn ? 'Details' : 'التفاصيل'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
