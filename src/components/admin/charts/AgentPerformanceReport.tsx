import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileCheck, 
  Clock, 
  CheckCircle, 
  ArrowLeftRight,
  TrendingUp,
  User,
  Download,
  BarChart3,
  AlertTriangle,
  Bell
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
import { format } from 'date-fns';
import { exportToExcel } from '@/lib/exportToExcel';
import { toast } from 'sonner';
import { useAgentPerformance, TimePeriod } from '@/hooks/useAgentPerformance';

const CHART_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  week: 'أسبوع',
  month: 'شهر',
  '3months': '3 أشهر'
};

export function AgentPerformanceReport() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const { 
    agents, 
    dailyActivity, 
    loading, 
    lowPerformanceAgents,
    notifyLowPerformance,
    performanceThreshold 
  } = useAgentPerformance(timePeriod);

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
      fileName: `تقرير_أداء_الوكلاء_${TIME_PERIOD_LABELS[timePeriod]}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
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
      {/* Header with Filter and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-bold">تقرير أداء الوكلاء</h3>
          <Badge variant="secondary">{agents.length} وكيل</Badge>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Period Filter */}
          <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
            <TabsList className="h-9">
              <TabsTrigger value="week" className="text-xs px-3">أسبوع</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-3">شهر</TabsTrigger>
              <TabsTrigger value="3months" className="text-xs px-3">3 أشهر</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button onClick={exportToExcelHandler} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Low Performance Alert */}
      {lowPerformanceAgents.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-warning">
                    {lowPerformanceAgents.length} وكيل بأداء منخفض (أقل من {performanceThreshold}%)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {lowPerformanceAgents.map(a => a.agent_name).join('، ')}
                  </p>
                </div>
              </div>
              <Button 
                onClick={notifyLowPerformance} 
                variant="outline" 
                size="sm"
                className="gap-2 border-warning text-warning hover:bg-warning/10"
              >
                <Bell className="h-4 w-4" />
                إرسال تنبيه
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Activity Line Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              نشاط الملفات المرسلة ({TIME_PERIOD_LABELS[timePeriod]})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="dateLabel" 
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
                  {agents.slice(0, 4).map((agent, index) => (
                    <Line
                      key={agent.agent_id}
                      type="monotone"
                      dataKey={agent.agent_name}
                      stroke={CHART_COLORS[index % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
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
      {pieData.length > 0 && pieData.some(d => d.value > 0) && (
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
          {agents.map((agent, index) => {
            const isLowPerformance = agent.total_assigned >= 3 && agent.completion_rate < performanceThreshold;
            
            return (
              <div 
                key={agent.agent_id} 
                className={`p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors ${
                  isLowPerformance ? 'border-warning/50 bg-warning/5' : ''
                }`}
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
                      <Badge 
                        variant={isLowPerformance ? "destructive" : "outline"} 
                        className="shrink-0"
                      >
                        {agent.completion_rate}% إنجاز
                      </Badge>
                      {isLowPerformance && (
                        <Badge variant="outline" className="shrink-0 border-warning text-warning">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          أداء منخفض
                        </Badge>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <Progress 
                        value={agent.completion_rate} 
                        className={`h-2 ${isLowPerformance ? '[&>div]:bg-warning' : ''}`}
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
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
