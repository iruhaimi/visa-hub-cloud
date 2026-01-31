import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, subMonths, startOfDay, eachDayOfInterval, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

export type TimePeriod = 'week' | 'month' | '3months';

export interface AgentStats {
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

export interface DailyActivity {
  date: string;
  dateLabel: string;
  [agentName: string]: string | number;
}

interface AgentProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const PERFORMANCE_THRESHOLD = 30; // Minimum completion rate percentage

export function useAgentPerformance(timePeriod: TimePeriod = 'week') {
  const [agents, setAgents] = useState<AgentStats[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowPerformanceAgents, setLowPerformanceAgents] = useState<AgentStats[]>([]);

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (timePeriod) {
      case 'week':
        return { start: subDays(now, 6), end: now, days: 7 };
      case 'month':
        return { start: subMonths(now, 1), end: now, days: 30 };
      case '3months':
        return { start: subMonths(now, 3), end: now, days: 90 };
      default:
        return { start: subDays(now, 6), end: now, days: 7 };
    }
  }, [timePeriod]);

  useEffect(() => {
    fetchAgentStats();
  }, [timePeriod, dateRange]);

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

      const startDate = dateRange.start.toISOString();
      const endDate = dateRange.end.toISOString();

      // Get applications stats within date range
      const { data: applications } = await supabase
        .from('applications')
        .select('assigned_agent_id, status, updated_at, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Get work submissions with dates within date range
      const { data: workSubmissions } = await supabase
        .from('agent_work_submissions')
        .select('agent_id, status, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Get transfer requests within date range
      const { data: transferRequests } = await supabase
        .from('agent_transfer_requests')
        .select('from_agent_id, status, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

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

      // Check for low performance agents
      const lowPerformers = agentStats.filter(
        agent => agent.total_assigned >= 3 && agent.completion_rate < PERFORMANCE_THRESHOLD
      );
      setLowPerformanceAgents(lowPerformers);

      // Build daily activity
      const intervalDays = eachDayOfInterval({
        start: dateRange.start,
        end: dateRange.end
      });

      // For 3 months, group by week instead of day
      const groupedDays = timePeriod === '3months' 
        ? intervalDays.filter((_, i) => i % 7 === 0 || i === intervalDays.length - 1)
        : timePeriod === 'month'
        ? intervalDays.filter((_, i) => i % 3 === 0 || i === intervalDays.length - 1)
        : intervalDays;

      const dailyData: DailyActivity[] = groupedDays.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const dateFormat = timePeriod === '3months' ? 'dd/MM' : timePeriod === 'month' ? 'dd/MM' : 'EEE';
        
        const entry: DailyActivity = {
          date: format(day, 'yyyy-MM-dd'),
          dateLabel: format(day, dateFormat, { locale: ar }),
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

  const notifyLowPerformance = async () => {
    if (lowPerformanceAgents.length === 0) {
      toast.info('جميع الوكلاء يؤدون بشكل جيد');
      return;
    }

    try {
      // Get all admin profile IDs
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (!adminRoles || adminRoles.length === 0) {
        toast.error('لا يوجد مسؤولين لإرسال الإشعارات');
        return;
      }

      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('id')
        .in('user_id', adminRoles.map(r => r.user_id));

      if (!adminProfiles || adminProfiles.length === 0) {
        toast.error('لا يوجد مسؤولين لإرسال الإشعارات');
        return;
      }

      // Create notifications for each admin about low performing agents
      const notifications = adminProfiles.flatMap(admin => 
        lowPerformanceAgents.map(agent => ({
          user_id: admin.id,
          title: '⚠️ تنبيه أداء منخفض',
          message: `الوكيل ${agent.agent_name} لديه نسبة إنجاز ${agent.completion_rate}% فقط (${agent.completed_applications}/${agent.total_assigned} طلب)`,
          type: 'performance_alert',
          action_url: '/admin/requests'
        }))
      );

      const { error } = await supabase.from('notifications').insert(notifications);

      if (error) {
        console.error('Error sending notifications:', error);
        toast.error('حدث خطأ أثناء إرسال الإشعارات');
        return;
      }

      toast.success(`تم إرسال ${lowPerformanceAgents.length} تنبيه للمسؤولين`);
    } catch (error) {
      console.error('Error in notifyLowPerformance:', error);
      toast.error('حدث خطأ أثناء إرسال الإشعارات');
    }
  };

  return {
    agents,
    dailyActivity,
    loading,
    lowPerformanceAgents,
    notifyLowPerformance,
    refetch: fetchAgentStats,
    performanceThreshold: PERFORMANCE_THRESHOLD,
  };
}
