import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileCheck, 
  Download, 
  Loader2, 
  User, 
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

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
  const [downloading, setDownloading] = useState<string | null>(null);

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

  const downloadFile = async (submission: WorkSubmission) => {
    setDownloading(submission.id);
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(submission.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = submission.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('تم تحميل الملف بنجاح');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('حدث خطأ في تحميل الملف');
    } finally {
      setDownloading(null);
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
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4 pl-2">
              {submissions.map((submission) => {
                const statusConfig = getStatusConfig(submission.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <div 
                    key={submission.id}
                    className="rounded-lg border p-4 space-y-3 hover:bg-muted/50 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{submission.file_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <User className="h-3 w-3" />
                            <span>{submission.agent?.full_name || 'غير معروف'}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(submission.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={statusConfig.className}>
                          <StatusIcon className="h-3 w-3 ml-1" />
                          {statusConfig.label}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => downloadFile(submission)}
                          disabled={downloading === submission.id}
                        >
                          {downloading === submission.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="h-4 w-4 ml-1" />
                              تحميل
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Notes */}
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
