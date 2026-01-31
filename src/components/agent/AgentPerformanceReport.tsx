import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Calendar,
  Target,
  Award,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-react';
import { format, subDays, subMonths, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PerformanceData {
  totalAssigned: number;
  completed: number;
  rejected: number;
  pending: number;
  transferred: number;
  avgCompletionDays: number;
  completionRate: number;
  monthlyTrend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface MonthlyBreakdown {
  month: string;
  completed: number;
  rejected: number;
  total: number;
}

const PERIOD_OPTIONS = [
  { value: 'month', label: 'الشهر الحالي' },
  { value: '3months', label: 'آخر 3 أشهر' },
  { value: '6months', label: 'آخر 6 أشهر' },
  { value: 'year', label: 'السنة الكاملة' },
];

export function AgentPerformanceReport() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [performance, setPerformance] = useState<PerformanceData>({
    totalAssigned: 0,
    completed: 0,
    rejected: 0,
    pending: 0,
    transferred: 0,
    avgCompletionDays: 0,
    completionRate: 0,
    monthlyTrend: 'stable',
    trendPercentage: 0,
  });
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyBreakdown[]>([]);

  useEffect(() => {
    if (profile) {
      fetchPerformanceData();
    }
  }, [profile, period]);

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case '3months':
        return { start: subMonths(now, 3), end: now };
      case '6months':
        return { start: subMonths(now, 6), end: now };
      case 'year':
        return { start: subMonths(now, 12), end: now };
      default:
        return { start: startOfMonth(now), end: now };
    }
  };

  const fetchPerformanceData = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { start, end } = getDateRange();

      // Fetch applications assigned to this agent
      const { data: applications } = await supabase
        .from('applications')
        .select('id, status, created_at, submitted_at, approved_at, updated_at')
        .eq('assigned_agent_id', profile.id)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      // Fetch work submissions
      const { data: workSubmissions } = await supabase
        .from('agent_work_submissions')
        .select('id, status, created_at')
        .eq('agent_id', profile.id)
        .eq('status', 'approved');

      // Fetch transfer requests
      const { data: transfers } = await supabase
        .from('agent_transfer_requests')
        .select('id, status')
        .eq('from_agent_id', profile.id)
        .eq('status', 'approved');

      const apps = applications || [];
      const completedApps = apps.filter(a => a.status === 'approved');
      const rejectedApps = apps.filter(a => a.status === 'rejected');
      const pendingApps = apps.filter(a => 
        ['submitted', 'under_review', 'documents_required', 'processing'].includes(a.status)
      );

      // Calculate average completion time
      let totalDays = 0;
      let countWithDates = 0;
      completedApps.forEach(app => {
        if (app.submitted_at && app.approved_at) {
          const days = differenceInDays(new Date(app.approved_at), new Date(app.submitted_at));
          totalDays += days;
          countWithDates++;
        }
      });
      const avgDays = countWithDates > 0 ? Math.round(totalDays / countWithDates) : 0;

      // Calculate completion rate
      const totalProcessed = completedApps.length + rejectedApps.length;
      const completionRate = totalProcessed > 0 
        ? Math.round((completedApps.length / totalProcessed) * 100) 
        : 0;

      // Calculate monthly trend (compare to previous period)
      const previousStart = subMonths(start, 1);
      const { data: prevApps } = await supabase
        .from('applications')
        .select('id, status')
        .eq('assigned_agent_id', profile.id)
        .gte('created_at', previousStart.toISOString())
        .lt('created_at', start.toISOString());

      const prevCompleted = (prevApps || []).filter(a => a.status === 'approved').length;
      const currentCompleted = completedApps.length;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      let trendPercentage = 0;
      
      if (prevCompleted > 0) {
        const diff = ((currentCompleted - prevCompleted) / prevCompleted) * 100;
        trendPercentage = Math.abs(Math.round(diff));
        trend = diff > 5 ? 'up' : diff < -5 ? 'down' : 'stable';
      } else if (currentCompleted > 0) {
        trend = 'up';
        trendPercentage = 100;
      }

      setPerformance({
        totalAssigned: apps.length,
        completed: completedApps.length,
        rejected: rejectedApps.length,
        pending: pendingApps.length,
        transferred: (transfers || []).length,
        avgCompletionDays: avgDays,
        completionRate,
        monthlyTrend: trend,
        trendPercentage,
      });

      // Monthly breakdown for charts
      const breakdown: MonthlyBreakdown[] = [];
      for (let i = 0; i < 6; i++) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));
        
        const monthApps = apps.filter(app => {
          const appDate = new Date(app.created_at);
          return appDate >= monthStart && appDate <= monthEnd;
        });

        breakdown.unshift({
          month: format(monthStart, 'MMM', { locale: ar }),
          completed: monthApps.filter(a => a.status === 'approved').length,
          rejected: monthApps.filter(a => a.status === 'rejected').length,
          total: monthApps.length,
        });
      }
      setMonthlyBreakdown(breakdown);

    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceLevel = () => {
    if (performance.completionRate >= 80) return { label: 'ممتاز', color: 'text-success', bg: 'bg-success/10' };
    if (performance.completionRate >= 60) return { label: 'جيد جداً', color: 'text-primary', bg: 'bg-primary/10' };
    if (performance.completionRate >= 40) return { label: 'جيد', color: 'text-warning', bg: 'bg-warning/10' };
    return { label: 'يحتاج تحسين', color: 'text-destructive', bg: 'bg-destructive/10' };
  };

  const performanceLevel = getPerformanceLevel();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">تقرير الأداء</h3>
            <p className="text-sm text-muted-foreground">
              {format(getDateRange().start, 'dd MMM', { locale: ar })} - {format(getDateRange().end, 'dd MMM yyyy', { locale: ar })}
            </p>
          </div>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <Calendar className="h-4 w-4 ml-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{performance.totalAssigned}</p>
                <p className="text-sm text-muted-foreground">إجمالي المعينة</p>
              </div>
              <Target className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-success">{performance.completed}</p>
                <p className="text-sm text-muted-foreground">مكتملة</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success/50" />
            </div>
            {performance.monthlyTrend !== 'stable' && (
              <div className="flex items-center gap-1 mt-2">
                {performance.monthlyTrend === 'up' ? (
                  <ArrowUp className="h-3 w-3 text-success" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-destructive" />
                )}
                <span className={`text-xs ${performance.monthlyTrend === 'up' ? 'text-success' : 'text-destructive'}`}>
                  {performance.trendPercentage}% مقارنة بالفترة السابقة
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-info/5 to-info/10 border-info/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{performance.avgCompletionDays}</p>
                <p className="text-sm text-muted-foreground">متوسط أيام الإنجاز</p>
              </div>
              <Clock className="h-8 w-8 text-info/50" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${performanceLevel.bg} border-current/20`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${performanceLevel.color}`}>{performance.completionRate}%</p>
                <p className="text-sm text-muted-foreground">معدل النجاح</p>
              </div>
              <Award className="h-8 w-8 opacity-50" />
            </div>
            <Badge className={`mt-2 ${performanceLevel.bg} ${performanceLevel.color}`}>
              {performanceLevel.label}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Progress Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">توزيع الحالات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">مكتملة</span>
                <span className="font-medium text-success">{performance.completed}</span>
              </div>
              <Progress value={(performance.completed / Math.max(performance.totalAssigned, 1)) * 100} className="h-2 bg-success/20" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">قيد المعالجة</span>
                <span className="font-medium text-warning">{performance.pending}</span>
              </div>
              <Progress value={(performance.pending / Math.max(performance.totalAssigned, 1)) * 100} className="h-2 bg-warning/20" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">مرفوضة</span>
                <span className="font-medium text-destructive">{performance.rejected}</span>
              </div>
              <Progress value={(performance.rejected / Math.max(performance.totalAssigned, 1)) * 100} className="h-2 bg-destructive/20" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">محولة</span>
                <span className="font-medium text-info">{performance.transferred}</span>
              </div>
              <Progress value={(performance.transferred / Math.max(performance.totalAssigned, 1)) * 100} className="h-2 bg-info/20" />
            </div>
          </CardContent>
        </Card>

        {/* Monthly Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">الإنجاز الشهري</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-32 gap-2">
              {monthlyBreakdown.map((month, idx) => {
                const maxVal = Math.max(...monthlyBreakdown.map(m => m.total), 1);
                const height = (month.completed / maxVal) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col justify-end h-24">
                      <div 
                        className="w-full bg-success/80 rounded-t transition-all duration-300"
                        style={{ height: `${height}%`, minHeight: month.completed > 0 ? '4px' : '0' }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{month.month}</span>
                    <span className="text-xs font-medium">{month.completed}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
