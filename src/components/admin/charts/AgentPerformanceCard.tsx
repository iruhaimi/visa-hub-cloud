import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface AgentStats {
  id: string;
  name: string;
  totalAssigned: number;
  completed: number;
  pending: number;
  rejected: number;
  completionRate: number;
}

export default function AgentPerformanceCard() {
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentStats();
  }, []);

  const fetchAgentStats = async () => {
    try {
      // Fetch agents
      const { data: agentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'agent');

      if (rolesError) throw rolesError;

      if (!agentRoles || agentRoles.length === 0) {
        setAgentStats([]);
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

      // Fetch all applications with assigned agents
      const { data: applications, error: appsError } = await supabase
        .from('applications')
        .select('id, status, assigned_agent_id')
        .not('assigned_agent_id', 'is', null);

      if (appsError) throw appsError;

      // Calculate stats for each agent
      const stats: AgentStats[] = (agentProfiles || []).map(agent => {
        const agentApps = (applications || []).filter(app => app.assigned_agent_id === agent.id);
        const completed = agentApps.filter(app => app.status === 'approved').length;
        const rejected = agentApps.filter(app => app.status === 'rejected').length;
        const pending = agentApps.filter(app => 
          ['submitted', 'under_review', 'processing', 'documents_required'].includes(app.status)
        ).length;

        return {
          id: agent.id,
          name: agent.full_name || 'بدون اسم',
          totalAssigned: agentApps.length,
          completed,
          pending,
          rejected,
          completionRate: agentApps.length > 0 
            ? Math.round((completed / agentApps.length) * 100) 
            : 0,
        };
      });

      // Sort by total assigned descending
      stats.sort((a, b) => b.totalAssigned - a.totalAssigned);
      setAgentStats(stats);
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
            <Users className="h-5 w-5" />
            أداء الوكلاء
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          أداء الوكلاء
        </CardTitle>
      </CardHeader>
      <CardContent>
        {agentStats.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">لا يوجد وكلاء حالياً</p>
        ) : (
          <div className="space-y-4">
            {agentStats.map(agent => (
              <div key={agent.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{agent.name}</div>
                  <Badge variant="outline">{agent.totalAssigned} طلب</Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span>{agent.completed} منجز</span>
                  </div>
                  <div className="flex items-center gap-1 text-warning">
                    <Clock className="h-4 w-4" />
                    <span>{agent.pending} معلق</span>
                  </div>
                  <div className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{agent.rejected} مرفوض</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>نسبة الإنجاز</span>
                    <span>{agent.completionRate}%</span>
                  </div>
                  <Progress value={agent.completionRate} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
