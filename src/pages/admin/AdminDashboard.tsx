import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Users,
  TrendingUp,
  Loader2
} from 'lucide-react';

interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalUsers: number;
  recentApplications: any[];
}

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    totalUsers: 0,
    recentApplications: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch applications count by status
      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select('id, status, created_at, visa_type_id');

      if (appError) throw appError;

      const totalApplications = applications?.length || 0;
      const pendingApplications = applications?.filter(a => 
        ['submitted', 'under_review', 'processing', 'documents_required'].includes(a.status)
      ).length || 0;
      const approvedApplications = applications?.filter(a => a.status === 'approved').length || 0;
      const rejectedApplications = applications?.filter(a => a.status === 'rejected').length || 0;

      // Fetch users count (only for admin)
      let totalUsers = 0;
      if (isAdmin) {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        totalUsers = count || 0;
      }

      // Fetch recent applications with visa type info
      const { data: recentApps } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          visa_type:visa_types(name, country:countries(name))
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        totalUsers,
        recentApplications: recentApps || [],
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'إجمالي الطلبات',
      value: stats.totalApplications,
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'طلبات قيد المعالجة',
      value: stats.pendingApplications,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'طلبات معتمدة',
      value: stats.approvedApplications,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'طلبات مرفوضة',
      value: stats.rejectedApplications,
      icon: XCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  if (isAdmin) {
    statCards.push({
      title: 'إجمالي المستخدمين',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-info',
      bgColor: 'bg-info/10',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold">مرحباً بك في لوحة التحكم</h2>
        <p className="text-muted-foreground">نظرة عامة على حالة الطلبات والإحصائيات</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>أحدث الطلبات</CardTitle>
          <Link 
            to={isAdmin ? '/admin/applications' : '/agent/applications'}
            className="text-sm text-primary hover:underline"
          >
            عرض الكل
          </Link>
        </CardHeader>
        <CardContent>
          {stats.recentApplications.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">لا توجد طلبات حالياً</p>
          ) : (
            <div className="space-y-3">
              {stats.recentApplications.map((app) => (
                <div 
                  key={app.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {app.visa_type?.country?.name} - {app.visa_type?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'مسودة', className: 'bg-muted text-muted-foreground' },
    pending_payment: { label: 'بانتظار الدفع', className: 'bg-warning/10 text-warning' },
    submitted: { label: 'مقدم', className: 'bg-info/10 text-info' },
    under_review: { label: 'قيد المراجعة', className: 'bg-primary/10 text-primary' },
    documents_required: { label: 'مستندات مطلوبة', className: 'bg-warning/10 text-warning' },
    processing: { label: 'قيد المعالجة', className: 'bg-primary/10 text-primary' },
    approved: { label: 'معتمد', className: 'bg-success/10 text-success' },
    rejected: { label: 'مرفوض', className: 'bg-destructive/10 text-destructive' },
    cancelled: { label: 'ملغي', className: 'bg-muted text-muted-foreground' },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
