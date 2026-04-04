import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, CalendarCheck, Eye, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface OperatorProfile {
  id: string;
  company_name: string;
  is_verified: boolean;
  is_active: boolean;
}

export default function TourOperatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [operator, setOperator] = useState<OperatorProfile | null>(null);
  const [stats, setStats] = useState({ programs: 0, bookings: 0, views: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch operator profile
        const { data: op } = await supabase
          .from('tour_operators')
          .select('id, company_name, is_verified, is_active')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!op) {
          // No profile yet - redirect to setup
          navigate('/tour-operator/setup');
          return;
        }

        setOperator(op);

        // Fetch stats
        const [programsRes, bookingsRes] = await Promise.all([
          supabase.from('tour_programs').select('id, views_count', { count: 'exact' }).eq('operator_id', op.id),
          supabase.from('tour_bookings').select('id', { count: 'exact' }).eq('operator_id', op.id),
        ]);

        const totalViews = (programsRes.data || []).reduce((sum, p) => sum + (p.views_count || 0), 0);
        
        setStats({
          programs: programsRes.count || 0,
          bookings: bookingsRes.count || 0,
          views: totalViews,
        });
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

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
        <div>
          <h1 className="text-2xl font-bold">مرحباً، {operator?.company_name}</h1>
          <p className="text-muted-foreground">
            {operator?.is_verified 
              ? '✅ حسابك موثق - برامجك تُنشر مباشرة'
              : '⏳ حسابك قيد المراجعة - برامجك تحتاج موافقة الإدارة'
            }
          </p>
        </div>
        <Button asChild>
          <Link to="/tour-operator/programs/new">
            <Plus className="h-4 w-4 ml-2" />
            إضافة برنامج
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">البرامج السياحية</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.programs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الحجوزات</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">المشاهدات</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.views}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
