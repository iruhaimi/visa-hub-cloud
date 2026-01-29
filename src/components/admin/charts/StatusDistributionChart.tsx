import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface StatusDistributionChartProps {
  applications: { status: string }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'مسودة', color: 'hsl(var(--muted-foreground))' },
  pending_payment: { label: 'بانتظار الدفع', color: 'hsl(45, 93%, 47%)' },
  submitted: { label: 'مقدم', color: 'hsl(199, 89%, 48%)' },
  under_review: { label: 'قيد المراجعة', color: 'hsl(var(--primary))' },
  documents_required: { label: 'مستندات مطلوبة', color: 'hsl(38, 92%, 50%)' },
  processing: { label: 'قيد المعالجة', color: 'hsl(262, 83%, 58%)' },
  approved: { label: 'معتمد', color: 'hsl(var(--success))' },
  rejected: { label: 'مرفوض', color: 'hsl(var(--destructive))' },
  cancelled: { label: 'ملغي', color: 'hsl(var(--muted))' },
};

export default function StatusDistributionChart({ applications }: StatusDistributionChartProps) {
  const chartData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    
    applications.forEach(app => {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    });
    
    return Object.entries(statusCounts)
      .map(([status, count]) => ({
        name: STATUS_CONFIG[status]?.label || status,
        value: count,
        status,
        color: STATUS_CONFIG[status]?.color || 'hsl(var(--muted))',
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [applications]);

  const total = applications.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">توزيع حالات الطلبات</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const percentage = ((data.value / total) * 100).toFixed(1);
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.value} طلب ({percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                layout="vertical"
                align="left"
                verticalAlign="middle"
                formatter={(value, entry: any) => (
                  <span className="text-sm">
                    {value} ({entry.payload.value})
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
