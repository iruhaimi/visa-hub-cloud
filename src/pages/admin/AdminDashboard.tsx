import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Users,
  Loader2,
  BarChart3,
  TrendingUp,
  Sparkles,
  Crown,
  Activity,
  ArrowUpRight,
  Calendar
} from 'lucide-react';
import ApplicationTrendsChart from '@/components/admin/charts/ApplicationTrendsChart';
import StatusDistributionChart from '@/components/admin/charts/StatusDistributionChart';
import CountryApplicationsChart from '@/components/admin/charts/CountryApplicationsChart';
import RevenueStatsCard from '@/components/admin/charts/RevenueStatsCard';
import RecentActivityFeed from '@/components/admin/charts/RecentActivityFeed';
import PerformanceMetricsCard from '@/components/admin/charts/PerformanceMetricsCard';
import AgentPerformanceCard from '@/components/admin/charts/AgentPerformanceCard';
import AgentNotesPerformance from '@/components/admin/charts/AgentNotesPerformance';
import AgentPerformanceChart from '@/components/admin/charts/AgentPerformanceChart';

interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalUsers: number;
  recentApplications: any[];
  allApplications: any[];
  payments: any[];
  statusHistory: any[];
}

export default function AdminDashboard() {
  const { isAdmin, profile } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    totalUsers: 0,
    recentApplications: [],
    allApplications: [],
    payments: [],
    statusHistory: [],
  });
  const [loading, setLoading] = useState(true);
  const currentDate = new Date();
  const greeting = getGreeting();

  function getGreeting() {
    const hour = currentDate.getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'مساء الخير';
    return 'مساء الخير';
  }

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch all applications with visa type and country info
      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select(`
          id, 
          status, 
          created_at, 
          submitted_at,
          approved_at,
          visa_type:visa_types(name, country:countries(name))
        `)
        .order('created_at', { ascending: false });

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

      // Fetch payments for revenue stats
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status, paid_at, created_at');

      // Fetch recent status changes
      const { data: statusHistory } = await supabase
        .from('application_status_history')
        .select('id, application_id, old_status, new_status, created_at, notes')
        .order('created_at', { ascending: false })
        .limit(20);

      setStats({
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        totalUsers,
        recentApplications: applications?.slice(0, 5) || [],
        allApplications: applications || [],
        payments: payments || [],
        statusHistory: statusHistory || [],
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
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 md:p-8 text-primary-foreground">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/4 translate-y-1/4" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/5 rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary-foreground/80">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {currentDate.toLocaleDateString('ar-SA', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Sparkles className="h-7 w-7" />
              {greeting}، {profile?.full_name?.split(' ')[0] || 'المشرف'}
            </h1>
            <p className="text-primary-foreground/80 max-w-lg">
              إليك نظرة سريعة على أداء المنصة اليوم. تابع الطلبات والإحصائيات من هنا.
            </p>
            {isSuperAdmin && (
              <Badge className="bg-white/20 text-white hover:bg-white/30 gap-1 mt-2">
                <Crown className="h-3 w-3" />
                مدير عام
              </Badge>
            )}
          </div>
          
          {/* Quick Stats in Hero */}
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center min-w-[100px]">
              <div className="text-3xl font-bold">{stats.pendingApplications}</div>
              <div className="text-xs text-primary-foreground/70">قيد المعالجة</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center min-w-[100px]">
              <div className="text-3xl font-bold flex items-center justify-center gap-1">
                {stats.approvedApplications}
                <ArrowUpRight className="h-4 w-4 text-green-300" />
              </div>
              <div className="text-xs text-primary-foreground/70">معتمدة</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat, index) => (
          <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor} transition-transform group-hover:scale-110`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">من إجمالي الطلبات</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            التحليلات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Applications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">أحدث الطلبات</CardTitle>
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

            {/* Recent Activity */}
            <RecentActivityFeed activities={stats.statusHistory} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Stats */}
            <RevenueStatsCard payments={stats.payments} />
            
            {/* Performance Metrics */}
            <PerformanceMetricsCard applications={stats.allApplications} />
          </div>

          {/* Agent Performance */}
          {isAdmin && (
            <div className="grid gap-4 md:grid-cols-2">
              <AgentPerformanceCard />
              <AgentNotesPerformance />
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Agent Performance Charts */}
          {isAdmin && <AgentPerformanceChart />}

          {/* Application Trends */}
          <ApplicationTrendsChart applications={stats.allApplications} days={30} />

          <div className="grid gap-4 md:grid-cols-2">
            {/* Status Distribution */}
            <StatusDistributionChart applications={stats.allApplications} />
            
            {/* Country Applications */}
            <CountryApplicationsChart applications={stats.allApplications} />
          </div>
        </TabsContent>
      </Tabs>
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
