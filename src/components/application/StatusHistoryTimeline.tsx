
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import type { ApplicationStatus } from '@/types/database';

const STATUS_LABELS: Record<ApplicationStatus, { ar: string; en: string }> = {
  draft: { ar: 'مسودة', en: 'Draft' },
  pending_payment: { ar: 'بانتظار الدفع', en: 'Pending Payment' },
  submitted: { ar: 'تم الإرسال', en: 'Submitted' },
  whatsapp_pending: { ar: 'واتساب', en: 'WhatsApp' },
  under_review: { ar: 'قيد المراجعة', en: 'Under Review' },
  documents_required: { ar: 'مستندات مطلوبة', en: 'Documents Required' },
  processing: { ar: 'قيد المعالجة', en: 'Processing' },
  approved: { ar: 'تمت الموافقة', en: 'Approved' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
};

interface HistoryEntry {
  id: string;
  old_status: ApplicationStatus | null;
  new_status: ApplicationStatus;
  created_at: string;
  notes: string | null;
}

export function StatusHistoryTimeline({ applicationId }: { applicationId: string }) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('application_status_history')
        .select('id, old_status, new_status, created_at, notes')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });
      setHistory((data || []) as HistoryEntry[]);
      setLoading(false);
    };
    fetch();
  }, [applicationId]);

  if (loading || history.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          {isRTL ? 'سجل تحديثات الحالة' : 'Status History'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          <div className={`absolute top-0 bottom-0 ${isRTL ? 'right-[11px]' : 'left-[11px]'} w-0.5 bg-muted`} />
          {history.map(entry => {
            const newLabel = STATUS_LABELS[entry.new_status];
            return (
              <div key={entry.id} className={`flex items-start gap-3 relative ${isRTL ? 'pr-0' : 'pl-0'}`}>
                <div className="w-6 h-6 rounded-full bg-primary/10 border-2 border-primary shrink-0 z-10" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.old_status && (
                      <>
                        <Badge variant="outline" className="text-xs">
                          {isRTL ? STATUS_LABELS[entry.old_status].ar : STATUS_LABELS[entry.old_status].en}
                        </Badge>
                        <span className="text-muted-foreground">←</span>
                      </>
                    )}
                    <Badge className="text-xs bg-primary/10 text-primary border-0">
                      {isRTL ? newLabel.ar : newLabel.en}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(entry.created_at), 'dd MMM yyyy - HH:mm', { locale: isRTL ? ar : enUS })}
                  </p>
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground mt-1 bg-muted/50 rounded p-2">{entry.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
