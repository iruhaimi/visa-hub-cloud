import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Application {
  visa_type?: {
    country?: {
      name: string;
    };
  };
}

interface CountryApplicationsChartProps {
  applications: Application[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
  'hsl(38, 92%, 50%)',
  'hsl(var(--destructive))',
  'hsl(340, 82%, 52%)',
  'hsl(160, 84%, 39%)',
];

export default function CountryApplicationsChart({ applications }: CountryApplicationsChartProps) {
  const chartData = useMemo(() => {
    const countryCounts: Record<string, number> = {};
    
    applications.forEach(app => {
      const countryName = app.visa_type?.country?.name || 'غير محدد';
      countryCounts[countryName] = (countryCounts[countryName] || 0) + 1;
    });
    
    return Object.entries(countryCounts)
      .map(([country, count]) => ({
        country,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 countries
  }, [applications]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">الطلبات حسب الدولة</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis 
                type="number" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis 
                type="category" 
                dataKey="country" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={75}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.country}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.count} طلب
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
