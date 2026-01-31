import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileCheck, 
  Clock, 
  CheckCircle, 
  ArrowLeftRight,
  TrendingUp,
  User,
  Download,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { ar } from 'date-fns/locale';
import { exportToExcel } from '@/lib/exportToExcel';
import { toast } from 'sonner';

interface AgentStats {
  agent_id: string;
  agent_name: string;
  avatar_url: string | null;
  total_assigned: number;
  completed_applications: number;
  pending_applications: number;
  work_submissions_total: number;
  work_submissions_approved: number;
  work_submissions_pending: number;
  transfer_requests_sent: number;
  transfer_requests_approved: number;
  completion_rate: number;
}

interface DailyActivity {
  date: string;
  dateLabel: string;
  [agentName: string]: string | number;
}

const CHART_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function AgentPerformanceReport() {
  const [agents, setAgents] = useState<AgentStats[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentStats();
  }, []);

  const fetchAgentStats = async () => {
    setLoading(true);
    try {
      // Get all agents
      const { data: agentRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'agent');
      const agentUserIds = agentRoles?.map(r => r.user_id) || [];

      if (agentUserIds.length === 0) {
        setAgents([]);
        setLoading(false);
        return;
      }

      const { data: agentProfiles } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url')
        .in('user_id', agentUserIds);

      if (!agentProfiles || agentProfiles.length === 0) {
        setAgents([]);
        setLoading(false);
        return;
      }

      // Get applications stats
      const { data: applications } = await supabase
        .from('applications')
        .select('assigned_agent_id, status, updated_at');

      // Get work submissions with dates
      const { data: workSubmissions } = await supabase
        .from('agent_work_submissions')
        .select('agent_id, status, created_at');

      // Get transfer requests
      const { data: transferRequests } = await supabase
        .from('agent_transfer_requests')
        .select('from_agent_id, status');

      // Build agent stats
      const agentStats: AgentStats[] = agentProfiles.map(agent => {
        const agentApps = applications?.filter(a => a.assigned_agent_id === agent.id) || [];
        const agentWork = workSubmissions?.filter(w => w.agent_id === agent.id) || [];
        const agentTransfers = transferRequests?.filter(t => t.from_agent_id === agent.id) || [];

        const completed = agentApps.filter(a => a.status === 'approved').length;
        const total = agentApps.length;

        return {
          agent_id: agent.id,
          agent_name: agent.full_name || 'بدون اسم',
          avatar_url: agent.avatar_url,
          total_assigned: total,
          completed_applications: completed,
          pending_applications: agentApps.filter(a => !['approved', 'rejected', 'cancelled'].includes(a.status)).length,
          work_submissions_total: agentWork.length,
          work_submissions_approved: agentWork.filter(w => w.status === 'approved').length,
          work_submissions_pending: agentWork.filter(w => w.status === 'pending').length,
          transfer_requests_sent: agentTransfers.length,
          transfer_requests_approved: agentTransfers.filter(t => t.status === 'approved').length,
          completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      });

      // Sort by completion rate descending
      agentStats.sort((a, b) => b.completion_rate - a.completion_rate);
      setAgents(agentStats);

      // Build daily activity for last 7 days
      const last7Days = eachDayOfInterval({
        start: subDays(new Date(), 6),
        end: new Date()
      });

      const dailyData: DailyActivity[] = last7Days.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const entry: DailyActivity = {
          date: format(day, 'yyyy-MM-dd'),
          dateLabel: format(day, 'EEE', { locale: ar }),
        };

        agentProfiles.forEach(agent => {
          const agentName = agent.full_name || 'وكيل';
          const daySubmissions = workSubmissions?.filter(w => {
            const wDate = new Date(w.created_at);
            return w.agent_id === agent.id && wDate >= dayStart && wDate <= dayEnd;
          }).length || 0;
          entry[agentName] = daySubmissions;
        });

        return entry;
      });

      setDailyActivity(dailyData);
    } catch (error) {
      console.error('Error fetching agent stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcelHandler = async () => {
    if (agents.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    const data = agents.map(agent => ({
      agent_name: agent.agent_name,
      total_assigned: agent.total_assigned,
      completed_applications: agent.completed_applications,
      pending_applications: agent.pending_applications,
      completion_rate: `${agent.completion_rate}%`,
      work_submissions_total: agent.work_submissions_total,
      work_submissions_approved: agent.work_submissions_approved,
      transfer_requests_sent: agent.transfer_requests_sent,
    }));

    await exportToExcel({
      sheetName: 'أداء الوكلاء',
      fileName: `تقرير_أداء_الوكلاء_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
      columns: [
        { header: 'اسم الوكيل', key: 'agent_name', width: 25 },
        { header: 'إجمالي الطلبات', key: 'total_assigned', width: 15 },
        { header: 'الطلبات المكتملة', key: 'completed_applications', width: 15 },
        { header: 'الطلبات المعلقة', key: 'pending_applications', width: 15 },
        { header: 'نسبة الإنجاز', key: 'completion_rate', width: 12 },
        { header: 'ملفات الإتمام', key: 'work_submissions_total', width: 15 },
        { header: 'ملفات معتمدة', key: 'work_submissions_approved', width: 15 },
        { header: 'طلبات التحويل', key: 'transfer_requests_sent', width: 15 },
      ],
      data,
    });
    toast.success('تم تصدير التقرير بنجاح');
  };

  // Pie chart data
  const pieData = agents.slice(0, 5).map((agent, index) => ({
    name: agent.agent_name,
    value: agent.total_assigned,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  // Bar chart data for comparison
  const barChartData = agents.map(agent => ({
    name: agent.agent_name.split(' ')[0],
    مكتمل: agent.completed_applications,
    معلق: agent.pending_applications,
    ملفات: agent.work_submissions_total,
  }));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            تقرير أداء الوكلاء
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (agents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            تقرير أداء الوكلاء
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>لا يوجد وكلاء في النظام</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-bold">تقرير أداء الوكلاء</h3>
          <Badge variant="secondary">{agents.length} وكيل</Badge>
        </div>
        <Button onClick={exportToExcelHandler} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          تصدير Excel
        </Button>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Activity Line Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              نشاط الملفات المرسلة (آخر 7 أيام)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="dateLabel" 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      direction: 'rtl'
                    }}
                  />
                  <Legend />
                  {agents.slice(0, 4).map((agent, index) => (
                    <Line
                      key={agent.agent_id}
                      type="monotone"
                      dataKey={agent.agent_name}
                      stroke={CHART_COLORS[index % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Agent Comparison Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              مقارنة أداء الوكلاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      direction: 'rtl'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="مكتمل" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="معلق" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ملفات" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Pie Chart */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">توزيع الطلبات على الوكلاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">تفاصيل أداء كل وكيل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {agents.map((agent, index) => (
            <div 
              key={agent.agent_id} 
              className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Rank & Avatar */}
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={agent.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {agent.agent_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {index < 3 && (
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                    }`}>
                      {index + 1}
                    </div>
                  )}
                </div>

                {/* Agent Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold truncate">{agent.agent_name}</h4>
                    <Badge variant="outline" className="shrink-0">
                      {agent.completion_rate}% إنجاز
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <Progress 
                      value={agent.completion_rate} 
                      className="h-2"
                    />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-4 w-4 text-warning" />
                      <span>{agent.pending_applications} قيد المعالجة</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>{agent.completed_applications} مكتمل</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <FileCheck className="h-4 w-4 text-primary" />
                      <span>{agent.work_submissions_total} ملف مرسل</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <ArrowLeftRight className="h-4 w-4 text-secondary-foreground" />
                      <span>{agent.transfer_requests_sent} طلب تحويل</span>
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="hidden md:flex flex-col items-end gap-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">إجمالي الطلبات:</span>
                    <Badge variant="secondary">{agent.total_assigned}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">ملفات معتمدة:</span>
                    <Badge variant="default" className="bg-success/10 text-success">
                      {agent.work_submissions_approved}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
