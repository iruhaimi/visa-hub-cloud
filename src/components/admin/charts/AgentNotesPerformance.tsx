import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  Loader2,
  Award,
  BarChart3
} from 'lucide-react';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AgentNoteStats {
  agentId: string;
  agentName: string;
  totalNotes: number;
  avgResponseTimeHours: number;
  lastNoteDate: string | null;
  applicationsHandled: number;
}

export default function AgentNotesPerformance() {
  const [stats, setStats] = useState<AgentNoteStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalNotes: 0,
    avgResponseTime: 0,
    activeAgents: 0,
  });

  useEffect(() => {
    fetchPerformanceStats();
  }, []);

  const fetchPerformanceStats = async () => {
    try {
      // Fetch all agent notes with application info
      const { data: notes, error: notesError } = await supabase
        .from('application_notes')
        .select('*')
        .eq('note_type', 'agent')
        .order('created_at', { ascending: true });

      if (notesError) throw notesError;

      // Fetch all applications with status history for response time calculation
      const { data: applications, error: appsError } = await supabase
        .from('applications')
        .select('id, assigned_agent_id, submitted_at')
        .not('assigned_agent_id', 'is', null);

      if (appsError) throw appsError;

      // Fetch agent profiles
      const { data: agentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'agent');

      if (rolesError) throw rolesError;

      const agentUserIds = agentRoles?.map(r => r.user_id) || [];

      const { data: agentProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, user_id')
        .in('user_id', agentUserIds);

      if (profilesError) throw profilesError;

      // Calculate stats per agent
      const agentStatsMap = new Map<string, AgentNoteStats>();

      (agentProfiles || []).forEach(agent => {
        agentStatsMap.set(agent.id, {
          agentId: agent.id,
          agentName: agent.full_name || 'بدون اسم',
          totalNotes: 0,
          avgResponseTimeHours: 0,
          lastNoteDate: null,
          applicationsHandled: 0,
        });
      });

      // Count notes per agent
      const notesByAgent = new Map<string, typeof notes>();
      (notes || []).forEach(note => {
        const existing = notesByAgent.get(note.author_id) || [];
        existing.push(note);
        notesByAgent.set(note.author_id, existing);
      });

      // Calculate response times (time from assignment to first note)
      const appFirstNotes = new Map<string, Date>();
      (notes || []).forEach(note => {
        const existing = appFirstNotes.get(note.application_id);
        const noteDate = new Date(note.created_at);
        if (!existing || noteDate < existing) {
          appFirstNotes.set(note.application_id, noteDate);
        }
      });

      // Update stats
      notesByAgent.forEach((agentNotes, authorId) => {
        const stat = agentStatsMap.get(authorId);
        if (stat) {
          stat.totalNotes = agentNotes.length;
          const sortedNotes = agentNotes.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          stat.lastNoteDate = sortedNotes[0]?.created_at || null;
        }
      });

      // Count applications handled per agent
      (applications || []).forEach(app => {
        if (app.assigned_agent_id) {
          const stat = agentStatsMap.get(app.assigned_agent_id);
          if (stat) {
            stat.applicationsHandled++;

            // Calculate response time if we have first note
            const firstNoteDate = appFirstNotes.get(app.id);
            if (firstNoteDate && app.submitted_at) {
              const submittedAt = new Date(app.submitted_at);
              const hours = differenceInHours(firstNoteDate, submittedAt);
              if (stat.avgResponseTimeHours === 0) {
                stat.avgResponseTimeHours = hours;
              } else {
                stat.avgResponseTimeHours = (stat.avgResponseTimeHours + hours) / 2;
              }
            }
          }
        }
      });

      const statsArray = Array.from(agentStatsMap.values())
        .filter(s => s.totalNotes > 0 || s.applicationsHandled > 0)
        .sort((a, b) => b.totalNotes - a.totalNotes);

      // Calculate totals
      const total = statsArray.reduce((acc, s) => ({
        totalNotes: acc.totalNotes + s.totalNotes,
        avgResponseTime: acc.avgResponseTime + s.avgResponseTimeHours,
        activeAgents: acc.activeAgents + 1,
      }), { totalNotes: 0, avgResponseTime: 0, activeAgents: 0 });

      if (total.activeAgents > 0) {
        total.avgResponseTime = Math.round(total.avgResponseTime / total.activeAgents);
      }

      setStats(statsArray);
      setTotalStats(total);
    } catch (error) {
      console.error('Error fetching performance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatResponseTime = (hours: number) => {
    if (hours < 1) {
      return 'أقل من ساعة';
    } else if (hours < 24) {
      return `${Math.round(hours)} ساعة`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days} يوم`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            تقارير أداء الموظفين
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
          <BarChart3 className="h-5 w-5" />
          تقارير أداء الموظفين
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-primary/10">
            <MessageSquare className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{totalStats.totalNotes}</div>
            <div className="text-sm text-muted-foreground">إجمالي الملاحظات</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-warning/10">
            <Clock className="h-6 w-6 mx-auto mb-2 text-warning" />
            <div className="text-2xl font-bold">{formatResponseTime(totalStats.avgResponseTime)}</div>
            <div className="text-sm text-muted-foreground">متوسط الاستجابة</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-success/10">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-success" />
            <div className="text-2xl font-bold">{totalStats.activeAgents}</div>
            <div className="text-sm text-muted-foreground">وكلاء نشطين</div>
          </div>
        </div>

        {/* Agent Performance List */}
        {stats.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">لا توجد بيانات أداء بعد</p>
        ) : (
          <div className="space-y-3">
            {stats.map((agent, index) => (
              <div 
                key={agent.agentId}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  {index === 0 && stats.length > 1 && (
                    <Award className="h-5 w-5 text-yellow-500" />
                  )}
                  <div>
                    <div className="font-medium">{agent.agentName}</div>
                    <div className="text-sm text-muted-foreground">
                      {agent.applicationsHandled} طلب معين
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-primary">{agent.totalNotes}</div>
                    <div className="text-xs text-muted-foreground">ملاحظة</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-warning">
                      {formatResponseTime(agent.avgResponseTimeHours)}
                    </div>
                    <div className="text-xs text-muted-foreground">متوسط الاستجابة</div>
                  </div>
                  {agent.lastNoteDate && (
                    <Badge variant="outline" className="text-xs">
                      آخر نشاط: {format(new Date(agent.lastNoteDate), 'dd/MM', { locale: ar })}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
