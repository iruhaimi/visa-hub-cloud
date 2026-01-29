import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Application {
  created_at: string;
  status: string;
}

interface ApplicationTrendsChartProps {
  applications: Application[];
  days?: number;
}

export default function ApplicationTrendsChart({ applications, days = 30 }: ApplicationTrendsChartProps) {
  const chartData = useMemo(() => {
    const endDate = startOfDay(new Date());
    const startDate = subDays(endDate, days - 1);
    
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    return dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayApps = applications.filter(app => 
        format(new Date(app.created_at), 'yyyy-MM-dd') === dateStr
      );
      
      return {
        date: format(date, 'MM/dd', { locale: ar }),
        fullDate: format(date, 'dd MMMM', { locale: ar }),
        total: dayApps.length,
        approved: dayApps.filter(a => a.status === 'approved').length,
        rejected: dayApps.filter(a => a.status === 'rejected').length,
        pending: dayApps.filter(a => ['submitted', 'under_review', 'processing'].includes(a.status)).length,
      };
    });
  }, [applications, days]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">اتجاهات الطلبات (آخر {days} يوم)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium mb-2">{data.fullDate}</p>
                        <div className="space-y-1 text-sm">
                          <p className="text-primary">إجمالي: {data.total}</p>
                          <p className="text-success">معتمدة: {data.approved}</p>
                          <p className="text-destructive">مرفوضة: {data.rejected}</p>
                          <p className="text-warning">قيد المعالجة: {data.pending}</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    total: 'إجمالي',
                    approved: 'معتمدة',
                    rejected: 'مرفوضة',
                    pending: 'قيد المعالجة'
                  };
                  return labels[value] || value;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="approved" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="rejected" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
