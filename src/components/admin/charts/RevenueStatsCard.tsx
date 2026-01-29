import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, RotateCcw, Wallet } from 'lucide-react';
import SARSymbol from '@/components/ui/SARSymbol';

interface Payment {
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

interface RevenueStatsCardProps {
  payments: Payment[];
}

export default function RevenueStatsCard({ payments }: RevenueStatsCardProps) {
  const completedPayments = payments.filter(p => p.status === 'completed');
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const refundedPayments = payments.filter(p => p.status === 'refunded');
  
  const totalRevenue = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingRevenue = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const refundedAmount = refundedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  
  // Calculate this month's revenue
  const now = new Date();
  const thisMonthPayments = completedPayments.filter(p => {
    const paidDate = new Date(p.paid_at || p.created_at);
    return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
  });
  const thisMonthRevenue = thisMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  
  // Calculate last month's revenue for comparison
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
  const lastMonthPayments = completedPayments.filter(p => {
    const paidDate = new Date(p.paid_at || p.created_at);
    return paidDate.getMonth() === lastMonth.getMonth() && paidDate.getFullYear() === lastMonth.getFullYear();
  });
  const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  
  const revenueChange = lastMonthRevenue > 0 
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
    : thisMonthRevenue > 0 ? 100 : 0;

  const stats = [
    {
      title: 'إجمالي الإيرادات',
      value: totalRevenue,
      icon: Wallet,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'إيرادات هذا الشهر',
      value: thisMonthRevenue,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      change: revenueChange,
    },
    {
      title: 'مدفوعات معلقة',
      value: pendingRevenue,
      icon: CreditCard,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'مبالغ مستردة',
      value: refundedAmount,
      icon: RotateCcw,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">إحصائيات الإيرادات</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{stat.title}</span>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{stat.value.toLocaleString()}</span>
                <SARSymbol className="text-sm text-muted-foreground" />
              </div>
              {stat.change !== undefined && (
                <div className={`flex items-center gap-1 mt-1 text-xs ${stat.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {stat.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{Math.abs(stat.change).toFixed(1)}% عن الشهر الماضي</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
