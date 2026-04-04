import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface TourProgram {
  id: string;
  title: string;
  destination: string;
  price: number;
  duration_days: number;
  duration_nights: number;
  status: string;
  views_count: number;
  seats_booked: number;
  max_seats: number | null;
  cover_image_url: string | null;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'مسودة', variant: 'secondary' },
  pending: { label: 'بانتظار الموافقة', variant: 'outline' },
  approved: { label: 'منشور', variant: 'default' },
  rejected: { label: 'مرفوض', variant: 'destructive' },
  archived: { label: 'مؤرشف', variant: 'secondary' },
};

export default function TourProgramsList() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<TourProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [operatorId, setOperatorId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchPrograms = async () => {
      const { data: op } = await supabase
        .from('tour_operators')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!op) {
        setLoading(false);
        return;
      }

      setOperatorId(op.id);

      const { data, error } = await supabase
        .from('tour_programs')
        .select('id, title, destination, price, duration_days, duration_nights, status, views_count, seats_booked, max_seats, cover_image_url, created_at')
        .eq('operator_id', op.id)
        .order('created_at', { ascending: false });

      if (!error) setPrograms(data || []);
      setLoading(false);
    };

    fetchPrograms();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا البرنامج؟')) return;
    const { error } = await supabase.from('tour_programs').delete().eq('id', id);
    if (error) {
      toast.error('لا يمكن حذف إلا البرامج في حالة مسودة');
    } else {
      setPrograms(programs.filter(p => p.id !== id));
      toast.success('تم حذف البرنامج');
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">برامجي السياحية</h1>
        <Button asChild>
          <Link to="/tour-operator/programs/new">
            <Plus className="h-4 w-4 ml-2" />
            إضافة برنامج
          </Link>
        </Button>
      </div>

      {programs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">لم تضف أي برامج سياحية بعد</p>
            <Button asChild>
              <Link to="/tour-operator/programs/new">
                <Plus className="h-4 w-4 ml-2" />
                أضف أول برنامج
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {programs.map((program) => (
            <Card key={program.id} className="overflow-hidden">
              <CardContent className="flex items-center gap-4 p-4">
                {program.cover_image_url ? (
                  <img
                    src={program.cover_image_url}
                    alt={program.title}
                    className="h-20 w-28 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-28 items-center justify-center rounded-lg bg-muted">
                    <Eye className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{program.title}</h3>
                    <Badge variant={STATUS_MAP[program.status]?.variant || 'secondary'}>
                      {STATUS_MAP[program.status]?.label || program.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {program.destination} • {program.duration_days} أيام / {program.duration_nights} ليالي
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{program.price.toLocaleString()} ر.س</span>
                    <span>{program.views_count} مشاهدة</span>
                    {program.max_seats && (
                      <span>{program.seats_booked}/{program.max_seats} حجز</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" asChild>
                    <Link to={`/tour-operator/programs/${program.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  {program.status === 'draft' && (
                    <Button variant="outline" size="icon" onClick={() => handleDelete(program.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
