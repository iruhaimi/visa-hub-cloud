import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MapPin, Clock, Users, Check, X, CalendarDays, Building2, Phone, MessageCircle, Star } from 'lucide-react';

export default function TourProgramDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    travelers_count: 1,
    preferred_date: '',
    notes: '',
  });

  useEffect(() => {
    const fetchProgram = async () => {
      const { data, error } = await supabase
        .from('tour_programs')
        .select('*, tour_operators:operator_id(company_name, company_name_en, logo_url, is_verified, whatsapp_number, phone, email, description)')
        .eq('id', id)
        .eq('status', 'approved')
        .maybeSingle();

      if (!error && data) {
        setProgram(data);
        // Increment views
        supabase.from('tour_programs').update({ views_count: (data.views_count || 0) + 1 }).eq('id', id).then();
      }
      setLoading(false);
    };

    if (id) fetchProgram();
  }, [id]);

  const handleBooking = async () => {
    if (!bookingForm.customer_name.trim() || !bookingForm.customer_phone.trim()) {
      toast.error(isEn ? 'Please fill name and phone' : 'يرجى إدخال الاسم ورقم الهاتف');
      return;
    }

    setBookingLoading(true);
    try {
      const { error } = await supabase.from('tour_bookings').insert({
        program_id: program.id,
        operator_id: program.operator_id,
        customer_name: bookingForm.customer_name,
        customer_phone: bookingForm.customer_phone,
        customer_email: bookingForm.customer_email || null,
        travelers_count: bookingForm.travelers_count,
        preferred_date: bookingForm.preferred_date || null,
        notes: bookingForm.notes || null,
        user_id: user?.id || null,
      });

      if (error) throw error;

      toast.success(isEn ? 'Booking request sent!' : 'تم إرسال طلب الحجز بنجاح! سيتم التواصل معك قريباً');
      setBookingOpen(false);
      setBookingForm({ customer_name: '', customer_phone: '', customer_email: '', travelers_count: 1, preferred_date: '', notes: '' });
    } catch (error) {
      toast.error(isEn ? 'Error submitting booking' : 'حدث خطأ أثناء إرسال الحجز');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleWhatsApp = () => {
    const whatsapp = program?.tour_operators?.whatsapp_number;
    if (!whatsapp) return;
    const text = `مرحباً، أرغب بالاستفسار عن برنامج: ${program.title}`;
    window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{isEn ? 'Program not found' : 'البرنامج غير موجود'}</p>
      </div>
    );
  }

  const inclusions = Array.isArray(program.inclusions) ? program.inclusions as string[] : [];
  const exclusions = Array.isArray(program.exclusions) ? program.exclusions as string[] : [];
  const itinerary = Array.isArray(program.daily_itinerary) ? program.daily_itinerary as string[] : [];
  const hotels = Array.isArray(program.hotels) ? program.hotels as string[] : [];

  return (
    <div className="space-y-8 py-8">
      {/* Hero */}
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden">
        {program.cover_image_url ? (
          <img src={program.cover_image_url} alt={program.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 right-0 left-0 p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">{isEn ? program.title_en || program.title : program.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {isEn ? program.destination_en || program.destination : program.destination}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {program.duration_days} {isEn ? 'days' : 'أيام'} / {program.duration_nights} {isEn ? 'nights' : 'ليالي'}</span>
            {program.max_seats && (
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {program.max_seats - program.seats_booked} {isEn ? 'seats left' : 'مقاعد متبقية'}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {program.description && (
            <Card>
              <CardHeader><CardTitle>{isEn ? 'About the Program' : 'عن البرنامج'}</CardTitle></CardHeader>
              <CardContent>
                <p className="whitespace-pre-line leading-relaxed">{isEn ? program.description_en || program.description : program.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Itinerary */}
          {itinerary.length > 0 && (
            <Card>
              <CardHeader><CardTitle>{isEn ? 'Daily Itinerary' : 'الجدول اليومي'}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {itinerary.map((day, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {i + 1}
                      </div>
                      <p className="pt-1">{day}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hotels */}
          {hotels.length > 0 && (
            <Card>
              <CardHeader><CardTitle>{isEn ? 'Hotels' : 'الفنادق'}</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {hotels.map((h, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      {h}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Inclusions / Exclusions */}
          {(inclusions.length > 0 || exclusions.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {inclusions.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-green-600">{isEn ? 'Includes' : 'يشمل'}</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {inclusions.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {exclusions.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-destructive">{isEn ? 'Excludes' : 'لا يشمل'}</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {exclusions.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <X className="h-4 w-4 text-destructive shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Cancellation */}
          {program.cancellation_policy && (
            <Card>
              <CardHeader><CardTitle>{isEn ? 'Cancellation Policy' : 'سياسة الإلغاء'}</CardTitle></CardHeader>
              <CardContent>
                <p>{isEn ? program.cancellation_policy_en || program.cancellation_policy : program.cancellation_policy}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-4">
              <div className="text-center">
                {program.discounted_price ? (
                  <div>
                    <span className="text-3xl font-bold text-primary">{program.discounted_price.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground mr-1">{isEn ? 'SAR' : 'ر.س'}</span>
                    <div className="mt-1">
                      <span className="text-sm line-through text-muted-foreground">{program.price.toLocaleString()} {isEn ? 'SAR' : 'ر.س'}</span>
                      {program.discount_percentage && (
                        <Badge className="mr-2 bg-destructive">{isEn ? 'Save' : 'وفر'} {program.discount_percentage}%</Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-3xl font-bold text-primary">{program.price.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground mr-1">{isEn ? 'SAR' : 'ر.س'}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{isEn ? 'per person' : 'للشخص الواحد'}</p>
              </div>

              {program.start_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>{isEn ? 'Starts:' : 'يبدأ:'} {program.start_date}</span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      {isEn ? 'Book Now' : 'احجز الآن'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent dir="rtl">
                    <DialogHeader>
                      <DialogTitle>{isEn ? 'Booking Request' : 'طلب حجز'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{isEn ? 'Full Name' : 'الاسم الكامل'} *</Label>
                        <Input value={bookingForm.customer_name} onChange={(e) => setBookingForm({ ...bookingForm, customer_name: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>{isEn ? 'Phone' : 'رقم الهاتف'} *</Label>
                        <Input value={bookingForm.customer_phone} onChange={(e) => setBookingForm({ ...bookingForm, customer_phone: e.target.value })} dir="ltr" />
                      </div>
                      <div className="space-y-2">
                        <Label>{isEn ? 'Email' : 'البريد الإلكتروني'}</Label>
                        <Input type="email" value={bookingForm.customer_email} onChange={(e) => setBookingForm({ ...bookingForm, customer_email: e.target.value })} dir="ltr" />
                      </div>
                      <div className="space-y-2">
                        <Label>{isEn ? 'Travelers' : 'عدد المسافرين'}</Label>
                        <Input type="number" min={1} value={bookingForm.travelers_count} onChange={(e) => setBookingForm({ ...bookingForm, travelers_count: parseInt(e.target.value) || 1 })} />
                      </div>
                      <div className="space-y-2">
                        <Label>{isEn ? 'Preferred Date' : 'التاريخ المفضل'}</Label>
                        <Input value={bookingForm.preferred_date} onChange={(e) => setBookingForm({ ...bookingForm, preferred_date: e.target.value })} placeholder={isEn ? 'e.g., June 2026' : 'مثال: يونيو 2026'} />
                      </div>
                      <div className="space-y-2">
                        <Label>{isEn ? 'Notes' : 'ملاحظات'}</Label>
                        <Textarea value={bookingForm.notes} onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })} rows={2} />
                      </div>
                      <Button className="w-full" onClick={handleBooking} disabled={bookingLoading}>
                        {bookingLoading ? (isEn ? 'Sending...' : 'جاري الإرسال...') : (isEn ? 'Submit Request' : 'إرسال طلب الحجز')}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {program.tour_operators?.whatsapp_number && (
                  <Button variant="outline" className="w-full" onClick={handleWhatsApp}>
                    <MessageCircle className="h-4 w-4 ml-2" />
                    {isEn ? 'Contact via WhatsApp' : 'تواصل عبر واتساب'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Operator Card */}
          {program.tour_operators && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{isEn ? 'Organized by' : 'مقدم البرنامج'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3">
                  {program.tour_operators.logo_url ? (
                    <img src={program.tour_operators.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{isEn ? program.tour_operators.company_name_en || program.tour_operators.company_name : program.tour_operators.company_name}</p>
                    {program.tour_operators.is_verified && (
                      <Badge variant="outline" className="text-xs mt-1">✓ {isEn ? 'Verified Partner' : 'شريك موثق'}</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
