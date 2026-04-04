import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  travelers_count: number;
  preferred_date: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  tour_programs: { title: string } | null;
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'جديد', variant: 'outline' },
  confirmed: { label: 'مؤكد', variant: 'default' },
  cancelled: { label: 'ملغي', variant: 'destructive' },
  completed: { label: 'مكتمل', variant: 'secondary' },
};

export default function TourBookingsList() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      const { data: op } = await supabase
        .from('tour_operators')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!op) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('tour_bookings')
        .select('*, tour_programs:program_id(title)')
        .eq('operator_id', op.id)
        .order('created_at', { ascending: false });

      if (!error) setBookings((data as any) || []);
      setLoading(false);
    };

    fetchBookings();
  }, [user]);

  const updateStatus = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase.from('tour_bookings').update({ status: newStatus }).eq('id', bookingId);
    if (error) {
      toast.error('حدث خطأ');
    } else {
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      toast.success('تم تحديث الحالة');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">الحجوزات</h1>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">لا توجد حجوزات حتى الآن</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{booking.customer_name}</h3>
                      <Badge variant={STATUS_MAP[booking.status]?.variant || 'secondary'}>
                        {STATUS_MAP[booking.status]?.label || booking.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      البرنامج: {booking.tour_programs?.title || 'غير محدد'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      📞 {booking.customer_phone}
                      {booking.customer_email && ` • ✉️ ${booking.customer_email}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      👥 {booking.travelers_count} مسافر
                      {booking.preferred_date && ` • 📅 ${booking.preferred_date}`}
                    </p>
                    {booking.notes && (
                      <p className="text-sm mt-1">💬 {booking.notes}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(booking.created_at), 'PPp', { locale: ar })}
                    </p>
                  </div>
                  <Select value={booking.status} onValueChange={(v) => updateStatus(booking.id, v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">جديد</SelectItem>
                      <SelectItem value="confirmed">مؤكد</SelectItem>
                      <SelectItem value="completed">مكتمل</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
