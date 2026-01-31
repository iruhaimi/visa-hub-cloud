import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileCheck, 
  Loader2, 
  User, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { FilePreview } from '@/components/ui/FilePreview';

interface WorkSubmission {
  id: string;
  file_name: string;
  file_path: string;
  notes: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  agent: {
    id: string;
    full_name: string;
  } | null;
}

interface WorkSubmissionsSectionProps {
  applicationId: string;
}

export function WorkSubmissionsSection({ applicationId }: WorkSubmissionsSectionProps) {
  const [submissions, setSubmissions] = useState<WorkSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, [applicationId]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_work_submissions')
        .select(`
          id,
          file_name,
          file_path,
          notes,
          status,
          admin_notes,
          created_at,
          reviewed_at,
          agent:profiles!agent_work_submissions_agent_id_fkey(
            id,
            full_name
          )
        `)
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data as WorkSubmission[] || []);
    } catch (error) {
      console.error('Error fetching work submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { 
          label: 'معتمد', 
          icon: CheckCircle, 
          className: 'bg-success/10 text-success border-success/20' 
        };
      case 'rejected':
        return { 
          label: 'مرفوض', 
          icon: XCircle, 
          className: 'bg-destructive/10 text-destructive border-destructive/20' 
        };
      case 'returned':
        return { 
          label: 'مُعاد للمراجعة', 
          icon: AlertCircle, 
          className: 'bg-warning/10 text-warning border-warning/20' 
        };
      default:
        return { 
          label: 'قيد المراجعة', 
          icon: Clock, 
          className: 'bg-info/10 text-info border-info/20' 
        };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileCheck className="h-5 w-5 text-primary" />
            ملفات إتمام العمل
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileCheck className="h-5 w-5 text-primary" />
          ملفات إتمام العمل ({submissions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-8">
            <FileCheck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">لا توجد ملفات إتمام عمل مرفقة</p>
          </div>
        ) : (
          <ScrollArea className="h-[350px] pr-2">
            <div className="space-y-4 pl-2">
              {submissions.map((submission) => {
                const statusConfig = getStatusConfig(submission.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <div 
                    key={submission.id}
                    className="rounded-lg border p-4 space-y-3 hover:bg-muted/50 transition-colors"
                  >
                    {/* Header with Agent Info */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="font-medium text-foreground">{submission.agent?.full_name || 'غير معروف'}</span>
                        <span className="mx-1">•</span>
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{format(new Date(submission.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}</span>
                      </div>
                      <Badge variant="outline" className={statusConfig.className}>
                        <StatusIcon className="h-3 w-3 ml-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* File Preview */}
                    <FilePreview 
                      fileName={submission.file_name}
                      filePath={submission.file_path}
                    />

                    {/* Agent Notes */}
                    {submission.notes && (
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground mb-1">ملاحظات الوكيل:</p>
                        <p className="text-sm">{submission.notes}</p>
                      </div>
                    )}

                    {/* Admin Notes */}
                    {submission.admin_notes && (
                      <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                        <p className="text-xs text-primary mb-1">رد المشرف:</p>
                        <p className="text-sm">{submission.admin_notes}</p>
                        {submission.reviewed_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            تمت المراجعة: {format(new Date(submission.reviewed_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
