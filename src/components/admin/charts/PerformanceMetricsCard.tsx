import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Clock, CheckCircle, Target } from 'lucide-react';
import { differenceInDays } from 'date-fns';

interface Application {
  status: string;
  created_at: string;
  submitted_at: string | null;
  approved_at: string | null;
}

interface PerformanceMetricsCardProps {
  applications: Application[];
}

export default function PerformanceMetricsCard({ applications }: PerformanceMetricsCardProps) {
  // Calculate approval rate
  const completedApps = applications.filter(a => ['approved', 'rejected'].includes(a.status));
  const approvedApps = applications.filter(a => a.status === 'approved');
  const approvalRate = completedApps.length > 0 
    ? (approvedApps.length / completedApps.length) * 100 
    : 0;

  // Calculate average processing time (from submitted to approved)
  const processedApps = applications.filter(a => a.status === 'approved' && a.submitted_at && a.approved_at);
  const avgProcessingDays = processedApps.length > 0
    ? processedApps.reduce((sum, app) => {
        return sum + differenceInDays(new Date(app.approved_at!), new Date(app.submitted_at!));
      }, 0) / processedApps.length
    : 0;

  // Calculate completion rate (apps that moved past draft)
  const nonDraftApps = applications.filter(a => a.status !== 'draft');
  const completionRate = applications.length > 0 
    ? (nonDraftApps.length / applications.length) * 100 
    : 0;

  // Calculate this week's applications
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeekApps = applications.filter(a => new Date(a.created_at) >= oneWeekAgo);

  const metrics = [
    {
      title: 'نسبة الموافقة',
      value: approvalRate,
      displayValue: `${approvalRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-success',
      target: 95,
    },
    {
      title: 'متوسط وقت المعالجة',
      value: avgProcessingDays,
      displayValue: `${avgProcessingDays.toFixed(1)} يوم`,
      icon: Clock,
      color: 'text-primary',
      target: 5,
      isInverse: true, // Lower is better
    },
    {
      title: 'معدل إكمال الطلبات',
      value: completionRate,
      displayValue: `${completionRate.toFixed(1)}%`,
      icon: Target,
      color: 'text-info',
      target: 80,
    },
    {
      title: 'طلبات هذا الأسبوع',
      value: thisWeekApps.length,
      displayValue: `${thisWeekApps.length} طلب`,
      icon: TrendingUp,
      color: 'text-warning',
      showProgress: false,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">مؤشرات الأداء</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                  <span className="text-sm font-medium">{metric.title}</span>
                </div>
                <span className="text-sm font-bold">{metric.displayValue}</span>
              </div>
              {metric.showProgress !== false && metric.target && (
                <div className="space-y-1">
                  <Progress 
                    value={metric.isInverse 
                      ? Math.min(100, (metric.target / Math.max(metric.value, 0.1)) * 100)
                      : Math.min(100, (metric.value / metric.target) * 100)
                    } 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>الهدف: {metric.isInverse ? `أقل من ${metric.target}` : metric.target}{metric.isInverse ? ' يوم' : '%'}</span>
                    {metric.value >= metric.target !== metric.isInverse && (
                      <span className="text-success">✓ تم تحقيق الهدف</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
