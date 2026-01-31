import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader2,
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Calendar,
  Target,
  Zap,
  Crown,
  Download
} from 'lucide-react';
import { format, subMonths, subWeeks, startOfMonth, endOfMonth, differenceInDays, eachMonthOfInterval } from 'date-fns';
import { ar } from 'date-fns/locale';
import { exportToExcel } from '@/lib/exportToExcel';
import { toast } from 'sonner';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';

interface AgentPerformance {
  id: string;
  userId: string;
  name: string;
  totalAssigned: number;
  completed: number;
  pending: number;
  rejected: number;
  transferred: number;
  completionRate: number;
  avgProcessingDays: number;
  notesCount: number;
  workSubmissions: number;
}

const PERIOD_OPTIONS = [
  { value: 'week', label: 'الأسبوع الحالي' },
  { value: 'month', label: 'الشهر الحالي' },
  { value: '3months', label: 'آخر 3 أشهر' },
  { value: '6months', label: 'آخر 6 أشهر' },
];

const SORT_OPTIONS = [
  { value: 'completionRate', label: 'نسبة الإنجاز' },
  { value: 'completed', label: 'عدد المنجز' },
  { value: 'totalAssigned', label: 'إجمالي المسند' },
  { value: 'avgProcessingDays', label: 'سرعة الإنجاز' },
];

interface MonthlyTrend {
  month: string;
  monthLabel: string;
  [agentName: string]: string | number;
}

const AGENT_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--info))',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

export default function AgentsComparisonTable() {
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [sortBy, setSortBy] = useState('completionRate');
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAgentsPerformance();
    fetchMonthlyTrends();
  }, [period]);

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'week':
        return { start: subWeeks(now, 1), end: now };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case '3months':
        return { start: subMonths(now, 3), end: now };
      case '6months':
        return { start: subMonths(now, 6), end: now };
      default:
        return { start: startOfMonth(now), end: now };
    }
  };

  const fetchAgentsPerformance = async () => {
    setLoading(true);
    try {
      // Fetch agents
      const { data: agentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'agent');

      if (rolesError) throw rolesError;

      if (!agentRoles || agentRoles.length === 0) {
        setAgents([]);
        setLoading(false);
        return;
      }

      const agentUserIds = agentRoles.map(r => r.user_id);

      // Fetch agent profiles
      const { data: agentProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, user_id')
        .in('user_id', agentUserIds);

      if (profilesError) throw profilesError;

      const { start, end } = getDateRange();

      // Fetch all applications
      const { data: applications } = await supabase
        .from('applications')
        .select('id, status, assigned_agent_id, created_at, submitted_at, approved_at')
        .not('assigned_agent_id', 'is', null)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      // Fetch transfer requests
      const { data: transfers } = await supabase
        .from('agent_transfer_requests')
        .select('from_agent_id, status')
        .eq('status', 'approved')
        .gte('created_at', start.toISOString());

      // Fetch work submissions
      const { data: workSubmissions } = await supabase
        .from('agent_work_submissions')
        .select('agent_id, status')
        .gte('created_at', start.toISOString());

      // Fetch notes count per agent
      const { data: notes } = await supabase
        .from('application_notes')
        .select('author_id')
        .gte('created_at', start.toISOString());

      // Calculate stats for each agent
      const performanceData: AgentPerformance[] = (agentProfiles || []).map(agent => {
        const agentApps = (applications || []).filter(app => app.assigned_agent_id === agent.id);
        const completedApps = agentApps.filter(app => app.status === 'approved');
        const rejectedApps = agentApps.filter(app => app.status === 'rejected');
        const pendingApps = agentApps.filter(app => 
          ['submitted', 'under_review', 'processing', 'documents_required'].includes(app.status)
        );
        const agentTransfers = (transfers || []).filter(t => t.from_agent_id === agent.id);
        const agentSubmissions = (workSubmissions || []).filter(w => w.agent_id === agent.id);
        const agentNotes = (notes || []).filter(n => n.author_id === agent.id);

        // Calculate average processing time
        let totalDays = 0;
        let countWithDates = 0;
        completedApps.forEach(app => {
          if (app.submitted_at && app.approved_at) {
            const days = differenceInDays(new Date(app.approved_at), new Date(app.submitted_at));
            if (days >= 0) {
              totalDays += days;
              countWithDates++;
            }
          }
        });
        const avgDays = countWithDates > 0 ? Math.round(totalDays / countWithDates) : 0;

        const totalProcessed = completedApps.length + rejectedApps.length;
        const completionRate = totalProcessed > 0 
          ? Math.round((completedApps.length / totalProcessed) * 100) 
          : 0;

        return {
          id: agent.id,
          userId: agent.user_id,
          name: agent.full_name || 'بدون اسم',
          totalAssigned: agentApps.length,
          completed: completedApps.length,
          pending: pendingApps.length,
          rejected: rejectedApps.length,
          transferred: agentTransfers.length,
          completionRate,
          avgProcessingDays: avgDays,
          notesCount: agentNotes.length,
          workSubmissions: agentSubmissions.length,
        };
      });

      setAgents(performanceData);
    } catch (error) {
      console.error('Error fetching agents performance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch monthly performance trends for line chart
  const fetchMonthlyTrends = async () => {
    try {
      // Get last 6 months
      const now = new Date();
      const months = eachMonthOfInterval({
        start: subMonths(now, 5),
        end: now,
      });

      // Fetch agents
      const { data: agentRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'agent');

      if (!agentRoles || agentRoles.length === 0) {
        setMonthlyTrends([]);
        return;
      }

      const { data: agentProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, user_id')
        .in('user_id', agentRoles.map(r => r.user_id));

      // Fetch all applications for the period
      const { data: applications } = await supabase
        .from('applications')
        .select('id, status, assigned_agent_id, approved_at')
        .not('assigned_agent_id', 'is', null)
        .gte('approved_at', subMonths(now, 6).toISOString());

      // Build monthly data
      const trends: MonthlyTrend[] = months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        const entry: MonthlyTrend = {
          month: format(month, 'yyyy-MM'),
          monthLabel: format(month, 'MMM', { locale: ar }),
        };

        (agentProfiles || []).forEach(agent => {
          const agentName = agent.full_name || 'وكيل';
          const completed = (applications || []).filter(app => {
            if (app.assigned_agent_id !== agent.id || app.status !== 'approved' || !app.approved_at) return false;
            const approvedDate = new Date(app.approved_at);
            return approvedDate >= monthStart && approvedDate <= monthEnd;
          }).length;
          entry[agentName] = completed;
        });

        return entry;
      });

      setMonthlyTrends(trends);
    } catch (error) {
      console.error('Error fetching monthly trends:', error);
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const periodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label || period;
      
      await exportToExcel({
        sheetName: 'أداء الوكلاء',
        fileName: `تقرير_أداء_الوكلاء_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
        columns: [
          { header: 'الترتيب', key: 'rank', width: 10 },
          { header: 'الوكيل', key: 'name', width: 25 },
          { header: 'إجمالي المسند', key: 'totalAssigned', width: 15 },
          { header: 'المنجز', key: 'completed', width: 12 },
          { header: 'قيد المعالجة', key: 'pending', width: 15 },
          { header: 'المرفوض', key: 'rejected', width: 12 },
          { header: 'طلبات التحويل', key: 'transferred', width: 15 },
          { header: 'متوسط أيام الإنجاز', key: 'avgProcessingDays', width: 18 },
          { header: 'نسبة الإنجاز %', key: 'completionRate', width: 15 },
          { header: 'عدد الملاحظات', key: 'notesCount', width: 15 },
          { header: 'عدد التسليمات', key: 'workSubmissions', width: 15 },
        ],
        data: sortedAgents.map((agent, idx) => ({
          rank: idx + 1,
          name: agent.name,
          totalAssigned: agent.totalAssigned,
          completed: agent.completed,
          pending: agent.pending,
          rejected: agent.rejected,
          transferred: agent.transferred,
          avgProcessingDays: agent.avgProcessingDays || 0,
          completionRate: agent.completionRate,
          notesCount: agent.notesCount,
          workSubmissions: agent.workSubmissions,
        })),
      });

      toast.success('تم تصدير التقرير بنجاح');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('حدث خطأ أثناء التصدير');
    } finally {
      setExporting(false);
    }
  };

  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => {
      switch (sortBy) {
        case 'completionRate':
          return b.completionRate - a.completionRate;
        case 'completed':
          return b.completed - a.completed;
        case 'totalAssigned':
          return b.totalAssigned - a.totalAssigned;
        case 'avgProcessingDays':
          // Lower is better for processing days
          if (a.avgProcessingDays === 0) return 1;
          if (b.avgProcessingDays === 0) return -1;
          return a.avgProcessingDays - b.avgProcessingDays;
        default:
          return b.completionRate - a.completionRate;
      }
    });
  }, [agents, sortBy]);

  const getRankBadge = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground font-medium">{index + 1}</span>;
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-success';
    if (rate >= 60) return 'text-primary';
    if (rate >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 80) return { label: 'ممتاز', className: 'bg-success/10 text-success border-success/20' };
    if (rate >= 60) return { label: 'جيد جداً', className: 'bg-primary/10 text-primary border-primary/20' };
    if (rate >= 40) return { label: 'جيد', className: 'bg-warning/10 text-warning border-warning/20' };
    return { label: 'يحتاج تحسين', className: 'bg-destructive/10 text-destructive border-destructive/20' };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            مقارنة أداء الوكلاء
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Summary stats
  const totalCompleted = agents.reduce((sum, a) => sum + a.completed, 0);
  const totalPending = agents.reduce((sum, a) => sum + a.pending, 0);
  const avgCompletionRate = agents.length > 0 
    ? Math.round(agents.reduce((sum, a) => sum + a.completionRate, 0) / agents.length) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">مقارنة أداء الوكلاء</CardTitle>
              <p className="text-sm text-muted-foreground">
                ترتيب الوكلاء حسب الأداء والإنتاجية
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={exporting || agents.length === 0}
              className="gap-2"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              تصدير Excel
            </Button>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36">
                <Calendar className="h-4 w-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36">
                <ArrowUpDown className="h-4 w-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Monthly Performance Trends Line Chart */}
        {monthlyTrends.length > 0 && agents.length > 0 && (
          <div className="rounded-lg border p-4 bg-muted/20">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">اتجاه الأداء الشهري</h3>
              <span className="text-xs text-muted-foreground">(آخر 6 أشهر)</span>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="monthLabel" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      direction: 'rtl'
                    }}
                    formatter={(value: number, name: string) => [`${value} طلب`, name]}
                  />
                  <Legend 
                    wrapperStyle={{ direction: 'rtl', paddingTop: '10px' }}
                  />
                  {agents.slice(0, 8).map((agent, idx) => (
                    <Line
                      key={agent.id}
                      type="monotone"
                      dataKey={agent.name}
                      stroke={AGENT_COLORS[idx % AGENT_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4, fill: AGENT_COLORS[idx % AGENT_COLORS.length] }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {/* Summary Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">إجمالي الوكلاء</span>
            </div>
            <p className="text-2xl font-bold">{agents.length}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-success/5">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">إجمالي المنجز</span>
            </div>
            <p className="text-2xl font-bold text-success">{totalCompleted}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-warning/5">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-warning" />
              <span className="text-sm text-muted-foreground">قيد المعالجة</span>
            </div>
            <p className="text-2xl font-bold text-warning">{totalPending}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-primary/5">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">متوسط الإنجاز</span>
            </div>
            <p className="text-2xl font-bold">{avgCompletionRate}%</p>
          </div>
        </div>

        {agents.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">لا يوجد وكلاء حالياً</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right w-16">#</TableHead>
                  <TableHead className="text-right">الوكيل</TableHead>
                  <TableHead className="text-center">المسندة</TableHead>
                  <TableHead className="text-center">المنجزة</TableHead>
                  <TableHead className="text-center">المعلقة</TableHead>
                  <TableHead className="text-center">المرفوضة</TableHead>
                  <TableHead className="text-center">متوسط أيام</TableHead>
                  <TableHead className="text-center">نسبة الإنجاز</TableHead>
                  <TableHead className="text-center">التقييم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAgents.map((agent, index) => {
                  const badge = getPerformanceBadge(agent.completionRate);
                  return (
                    <TableRow key={agent.id} className={index === 0 ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          {getRankBadge(index)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                            {agent.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {agent.notesCount} ملاحظة · {agent.workSubmissions} تسليم
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{agent.totalAssigned}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-success font-medium">{agent.completed}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-warning font-medium">{agent.pending}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-destructive font-medium">{agent.rejected}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Zap className="h-3 w-3 text-muted-foreground" />
                          <span>{agent.avgProcessingDays || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1">
                          <span className={`font-bold ${getPerformanceColor(agent.completionRate)}`}>
                            {agent.completionRate}%
                          </span>
                          <Progress 
                            value={agent.completionRate} 
                            className="h-1.5 w-16"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={badge.className}>
                          {badge.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
