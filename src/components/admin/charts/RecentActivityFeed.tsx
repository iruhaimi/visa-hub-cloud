import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, XCircle, Clock, AlertCircle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface StatusHistory {
  id: string;
  application_id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
  notes: string | null;
}

interface RecentActivityFeedProps {
  activities: StatusHistory[];
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  draft: { label: 'مسودة', icon: FileText, color: 'text-muted-foreground' },
  pending_payment: { label: 'بانتظار الدفع', icon: Clock, color: 'text-warning' },
  submitted: { label: 'مقدم', icon: FileText, color: 'text-info' },
  under_review: { label: 'قيد المراجعة', icon: AlertCircle, color: 'text-primary' },
  documents_required: { label: 'مستندات مطلوبة', icon: AlertCircle, color: 'text-warning' },
  processing: { label: 'قيد المعالجة', icon: Clock, color: 'text-primary' },
  approved: { label: 'معتمد', icon: CheckCircle, color: 'text-success' },
  rejected: { label: 'مرفوض', icon: XCircle, color: 'text-destructive' },
  cancelled: { label: 'ملغي', icon: XCircle, color: 'text-muted-foreground' },
};

export default function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">آخر النشاطات</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد نشاطات حديثة</p>
          ) : (
            activities.map((activity) => {
              const newConfig = STATUS_CONFIG[activity.new_status] || STATUS_CONFIG.draft;
              const oldConfig = activity.old_status ? STATUS_CONFIG[activity.old_status] : null;
              const Icon = newConfig.icon;
              
              return (
                <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                  <div className={`p-2 rounded-full bg-muted ${newConfig.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">تحديث حالة الطلب</span>
                      {oldConfig && (
                        <>
                          {' '}من{' '}
                          <span className={oldConfig.color}>{oldConfig.label}</span>
                        </>
                      )}
                      {' '}إلى{' '}
                      <span className={newConfig.color}>{newConfig.label}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), { 
                        addSuffix: true, 
                        locale: ar 
                      })}
                    </p>
                    {activity.notes && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        ملاحظة: {activity.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
