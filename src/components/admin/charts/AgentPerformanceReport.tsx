import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileCheck, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowLeftRight,
  TrendingUp,
  User
} from 'lucide-react';

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

export function AgentPerformanceReport() {
  const [agents, setAgents] = useState<AgentStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentStats();
  }, []);

  const fetchAgentStats = async () => {
    setLoading(true);
    try {
      // Get all agents
      const { data: agentProfiles } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url')
        .in('user_id', 
          (await supabase.from('user_roles').select('user_id').eq('role', 'agent')).data?.map(r => r.user_id) || []
        );

      if (!agentProfiles || agentProfiles.length === 0) {
        setAgents([]);
        setLoading(false);
        return;
      }

      // Get applications stats
      const { data: applications } = await supabase
        .from('applications')
        .select('assigned_agent_id, status');

      // Get work submissions
      const { data: workSubmissions } = await supabase
        .from('agent_work_submissions')
        .select('agent_id, status');

      // Get transfer requests
      const { data: transferRequests } = await supabase
        .from('agent_transfer_requests')
        .select('from_agent_id, status');

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
    } catch (error) {
      console.error('Error fetching agent stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          تقرير أداء الوكلاء
          <Badge variant="secondary" className="mr-auto">{agents.length} وكيل</Badge>
        </CardTitle>
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
  );
}
