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
  Crown
} from 'lucide-react';
import { format, subMonths, subWeeks, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';

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

export default function AgentsComparisonTable() {
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [sortBy, setSortBy] = useState('completionRate');

  useEffect(() => {
    fetchAgentsPerformance();
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
