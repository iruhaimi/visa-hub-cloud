import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  ReferenceLine
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { ar } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';

interface Application {
  created_at: string;
  status: string;
}

interface ApplicationTrendsChartProps {
  applications: Application[];
  days?: number;
}

export default function ApplicationTrendsChart({ applications, days = 30 }: ApplicationTrendsChartProps) {
  const [selectedDays, setSelectedDays] = useState(days);
  const [chartType, setChartType] = useState<'area' | 'stacked'>('area');

  const { chartData, stats } = useMemo(() => {
    const endDate = startOfDay(new Date());
    const startDate = subDays(endDate, selectedDays - 1);
    
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    const data = dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayApps = applications.filter(app => 
        format(new Date(app.created_at), 'yyyy-MM-dd') === dateStr
      );
      
      return {
        date: format(date, 'MM/dd', { locale: ar }),
        fullDate: format(date, 'dd MMMM yyyy', { locale: ar }),
        total: dayApps.length,
        approved: dayApps.filter(a => a.status === 'approved').length,
        rejected: dayApps.filter(a => a.status === 'rejected').length,
        pending: dayApps.filter(a => ['submitted', 'under_review', 'processing'].includes(a.status)).length,
        draft: dayApps.filter(a => a.status === 'draft').length,
      };
    });

    // Calculate statistics
    const totalInPeriod = data.reduce((sum, d) => sum + d.total, 0);
    const avgPerDay = totalInPeriod / selectedDays;
    
    // Compare with previous period
    const prevStartDate = subDays(startDate, selectedDays);
    const prevApps = applications.filter(app => {
      const date = new Date(app.created_at);
      return date >= prevStartDate && date < startDate;
    });
    const prevTotal = prevApps.length;
    const changePercent = prevTotal > 0 ? ((totalInPeriod - prevTotal) / prevTotal) * 100 : 0;

    return {
      chartData: data,
      stats: {
        total: totalInPeriod,
        avgPerDay,
        changePercent,
        maxDay: Math.max(...data.map(d => d.total)),
      }
    };
  }, [applications, selectedDays]);

  const dayOptions = [7, 14, 30, 60];

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            اتجاهات الطلبات
          </CardTitle>
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="secondary" className="font-normal">
              إجمالي: {stats.total} طلب
            </Badge>
            <Badge variant="outline" className="font-normal">
              متوسط: {stats.avgPerDay.toFixed(1)} / يوم
            </Badge>
            {stats.changePercent !== 0 && (
              <Badge 
                variant="outline" 
                className={`font-normal ${stats.changePercent >= 0 ? 'text-success border-success/30' : 'text-destructive border-destructive/30'}`}
              >
                {stats.changePercent >= 0 ? <TrendingUp className="h-3 w-3 ml-1" /> : <TrendingDown className="h-3 w-3 ml-1" />}
                {Math.abs(stats.changePercent).toFixed(0)}% من الفترة السابقة
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            {dayOptions.map((d) => (
              <Button
                key={d}
                variant={selectedDays === d ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setSelectedDays(d)}
              >
                {d} يوم
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => setChartType(chartType === 'area' ? 'stacked' : 'area')}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="approvedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="rejectedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={selectedDays <= 14 ? 0 : 'preserveStartEnd'}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={30}
              />
              <ReferenceLine 
                y={stats.avgPerDay} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5" 
                label={{ 
                  value: 'المتوسط', 
                  position: 'left',
                  fontSize: 10,
                  fill: 'hsl(var(--muted-foreground))'
                }} 
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium mb-2">{data.fullDate}</p>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between gap-4">
                            <span className="text-primary">إجمالي:</span>
                            <span className="font-medium">{data.total}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-success">معتمدة:</span>
                            <span className="font-medium">{data.approved}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-destructive">مرفوضة:</span>
                            <span className="font-medium">{data.rejected}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-warning">قيد المعالجة:</span>
                            <span className="font-medium">{data.pending}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="top"
                height={36}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    total: 'إجمالي',
                    approved: 'معتمدة',
                    rejected: 'مرفوضة',
                    pending: 'قيد المعالجة'
                  };
                  return <span className="text-xs">{labels[value] || value}</span>;
                }}
              />
              {chartType === 'stacked' ? (
                <>
                  <Area 
                    type="monotone" 
                    dataKey="approved" 
                    stackId="1"
                    stroke="hsl(var(--success))" 
                    fill="hsl(var(--success))"
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pending" 
                    stackId="1"
                    stroke="hsl(var(--warning))" 
                    fill="hsl(var(--warning))"
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rejected" 
                    stackId="1"
                    stroke="hsl(var(--destructive))" 
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.6}
                  />
                </>
              ) : (
                <>
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#totalGradient)"
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="approved" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    fill="url(#approvedGradient)"
                    activeDot={{ r: 4 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rejected" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    fill="url(#rejectedGradient)"
                    activeDot={{ r: 4 }}
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
