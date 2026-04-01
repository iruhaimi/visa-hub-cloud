import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from 'recharts';
import { PieChartIcon, LayoutGrid } from 'lucide-react';

interface StatusDistributionChartProps {
  applications: { status: string }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'مسودة', color: 'hsl(var(--muted-foreground))' },
  pending_payment: { label: 'بانتظار الدفع', color: 'hsl(45, 93%, 47%)' },
  submitted: { label: 'مقدم', color: 'hsl(199, 89%, 48%)' },
  whatsapp_pending: { label: 'بانتظار التواصل عبر الواتساب', color: 'hsl(152, 69%, 40%)' },
  under_review: { label: 'قيد المراجعة', color: 'hsl(var(--primary))' },
  documents_required: { label: 'مستندات مطلوبة', color: 'hsl(38, 92%, 50%)' },
  processing: { label: 'قيد المعالجة', color: 'hsl(262, 83%, 58%)' },
  approved: { label: 'معتمد', color: 'hsl(var(--success))' },
  rejected: { label: 'مرفوض', color: 'hsl(var(--destructive))' },
  cancelled: { label: 'ملغي', color: 'hsl(var(--muted))' },
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="hsl(var(--foreground))" className="text-sm font-medium">
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-xs">
        {value} طلب
      </text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-xs">
        ({(percent * 100).toFixed(1)}%)
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        fill={fill}
      />
    </g>
  );
};

export default function StatusDistributionChart({ applications }: StatusDistributionChartProps) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [viewMode, setViewMode] = useState<'chart' | 'grid'>('chart');

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

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(-1);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          توزيع حالات الطلبات
        </CardTitle>
        <div className="flex bg-muted rounded-lg p-0.5">
          <Button
            variant={viewMode === 'chart' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2"
            onClick={() => setViewMode('chart')}
          >
            <PieChartIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'chart' ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                    />
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
                      {value} <span className="text-muted-foreground">({entry.payload.value})</span>
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {chartData.map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="text-left">
                  <Badge variant="secondary" className="font-mono">
                    {item.value}
                  </Badge>
                  <span className="text-xs text-muted-foreground mr-1">
                    ({((item.value / total) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 pt-4 border-t flex justify-center">
          <Badge variant="outline" className="text-sm">
            إجمالي الطلبات: {total}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
