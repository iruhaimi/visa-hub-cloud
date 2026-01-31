import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area } from 'recharts';
import { TrendingUp, Loader2, MessageSquare, Clock, Activity } from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { ar } from 'date-fns/locale';

interface DailyAgentData {
  date: string;
  [agentName: string]: string | number;
}

interface AgentInfo {
  id: string;
  name: string;
  color: string;
}

const AGENT_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function AgentPerformanceChart() {
  const [notesData, setNotesData] = useState<DailyAgentData[]>([]);
  const [activityData, setActivityData] = useState<DailyAgentData[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      // Get last 14 days
      const endDate = new Date();
      const startDate = subDays(endDate, 13);
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

      // Fetch agents
      const { data: agentRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'agent');

      if (!agentRoles?.length) {
        setLoading(false);
        return;
      }

      const agentUserIds = agentRoles.map(r => r.user_id);

      const { data: agentProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, user_id')
        .in('user_id', agentUserIds);

      const agentsList: AgentInfo[] = (agentProfiles || []).map((agent, index) => ({
        id: agent.id,
        name: agent.full_name || 'وكيل',
        color: AGENT_COLORS[index % AGENT_COLORS.length],
      }));

      setAgents(agentsList);

      // Fetch notes for the period
      const { data: notes } = await supabase
        .from('application_notes')
        .select('author_id, created_at, note_type')
        .eq('note_type', 'agent')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Fetch applications status changes (activity)
      const { data: applications } = await supabase
        .from('applications')
        .select('assigned_agent_id, updated_at, status')
        .not('assigned_agent_id', 'is', null)
        .gte('updated_at', startDate.toISOString())
        .lte('updated_at', endDate.toISOString());

      // Process notes data by day
      const notesPerDay: DailyAgentData[] = dateRange.map(date => {
        const dayStr = format(date, 'yyyy-MM-dd');
        const dayData: DailyAgentData = { 
          date: format(date, 'MM/dd', { locale: ar }) 
        };

        agentsList.forEach(agent => {
          const count = (notes || []).filter(note => {
            const noteDate = format(new Date(note.created_at), 'yyyy-MM-dd');
            return noteDate === dayStr && note.author_id === agent.id;
          }).length;
          dayData[agent.name] = count;
        });

        return dayData;
      });

      // Process activity data by day
      const activityPerDay: DailyAgentData[] = dateRange.map(date => {
        const dayStr = format(date, 'yyyy-MM-dd');
        const dayData: DailyAgentData = { 
          date: format(date, 'MM/dd', { locale: ar }) 
        };

        agentsList.forEach(agent => {
          const count = (applications || []).filter(app => {
            const appDate = format(new Date(app.updated_at), 'yyyy-MM-dd');
            return appDate === dayStr && app.assigned_agent_id === agent.id;
          }).length;
          dayData[agent.name] = count;
        });

        return dayData;
      });

      setNotesData(notesPerDay);
      setActivityData(activityPerDay);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = agents.reduce((acc, agent, index) => {
    acc[agent.name] = {
      label: agent.name,
      color: agent.color,
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            أداء الوكلاء عبر الزمن
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            أداء الوكلاء عبر الزمن
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">لا يوجد وكلاء حالياً</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          أداء الوكلاء عبر الزمن (آخر 14 يوم)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              الملاحظات
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              النشاط
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={notesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  {agents.map((agent, index) => (
                    <linearGradient key={agent.id} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={agent.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={agent.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                {agents.map((agent, index) => (
                  <Area
                    key={agent.id}
                    type="monotone"
                    dataKey={agent.name}
                    stroke={agent.color}
                    fill={`url(#gradient-${index})`}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="activity">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                {agents.map((agent) => (
                  <Bar
                    key={agent.id}
                    dataKey={agent.name}
                    fill={agent.color}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>

        {/* Legend with agent colors */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
          {agents.map(agent => (
            <div key={agent.id} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: agent.color }}
              />
              <span className="text-sm text-muted-foreground">{agent.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
