import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  ArrowRight,
  User,
  Plane,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Loader2,
  AlertCircle,
  Save,
  FileDown
} from 'lucide-react';
import { generateApplicationPDF } from '@/lib/generateApplicationPDF';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import type { ApplicationStatus } from '@/types/database';

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'under_review', label: 'قيد المراجعة' },
  { value: 'documents_required', label: 'مستندات مطلوبة' },
  { value: 'processing', label: 'قيد المعالجة' },
  { value: 'approved', label: 'معتمد' },
  { value: 'rejected', label: 'مرفوض' },
];

interface ApplicationData {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  travel_date: string | null;
  return_date: string | null;
  purpose_of_travel: string | null;
  accommodation_details: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  agent_notes: string | null;
  rejection_reason: string | null;
  visa_type: {
    name: string;
    price: number;
    processing_days: number;
    country: {
      name: string;
      code: string;
    };
  };
  profile: {
    full_name: string;
    phone: string;
    nationality: string;
    passport_number: string;
    passport_expiry: string;
    date_of_birth: string;
  };
}

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  status: string;
  created_at: string;
}

interface StatusHistory {
  id: string;
  old_status: string | null;
  new_status: string;
  notes: string | null;
  created_at: string;
}

function InfoRow({ label, value, className = '' }: { label: string; value: string | null | undefined; className?: string }) {
  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || '-'}</p>
    </div>
  );
}

export default function AgentApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile: currentUserProfile } = useAuth();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Status change dialog
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<ApplicationStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Notes
  const [agentNotes, setAgentNotes] = useState('');

  useEffect(() => {
    if (id) {
      fetchApplicationData();
    }
  }, [id]);

  const fetchApplicationData = async () => {
    try {
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select(`
          *,
          visa_type:visa_types(
            name,
            price,
            processing_days,
            country:countries(name, code)
          ),
          profile:profiles!applications_user_id_fkey(
            full_name,
            phone,
            nationality,
            passport_number,
            passport_expiry,
            date_of_birth
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (appError) throw appError;
      
      if (!appData) {
        setLoading(false);
        return;
      }
      
      setApplication(appData as ApplicationData);
      setAgentNotes(appData.agent_notes || '');

      // Fetch documents
      const { data: docsData } = await supabase
        .from('application_documents')
        .select('*')
        .eq('application_id', id)
        .order('created_at', { ascending: false });
      
      setDocuments(docsData || []);

      // Fetch status history
      const { data: historyData } = await supabase
        .from('application_status_history')
        .select('*')
        .eq('application_id', id)
        .order('created_at', { ascending: false });
      
      setStatusHistory(historyData || []);
    } catch (error) {
      console.error('Error fetching application:', error);
      toast.error('حدث خطأ في تحميل بيانات الطلب');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || !application) return;

    setUpdating(true);
    try {
      const updates: Record<string, unknown> = { status: newStatus };
      
      if (newStatus === 'rejected') {
        updates.rejection_reason = rejectionReason;
      }
      
      if (newStatus === 'approved') {
        updates.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', application.id);

      if (error) throw error;

      // Add history note if provided
      if (statusNote) {
        await supabase
          .from('application_status_history')
          .insert({
            application_id: application.id,
            old_status: application.status,
            new_status: newStatus,
            notes: statusNote,
            changed_by: currentUserProfile?.id,
          });
      }

      // Notify the customer about status change
      const { data: appOwnerData } = await supabase
        .from('applications')
        .select('user_id')
        .eq('id', application.id)
        .single();

      if (appOwnerData?.user_id) {
        const statusLabel = STATUS_OPTIONS.find(s => s.value === newStatus)?.label || newStatus;
        await supabase.from('notifications').insert({
          user_id: appOwnerData.user_id,
          title: 'تحديث حالة الطلب',
          message: `تم تحديث حالة طلبك إلى: ${statusLabel}`,
          type: 'status_update',
          action_url: `/track?id=${application.id}`,
        });
      }

      toast.success('تم تحديث حالة الطلب بنجاح');
      setShowStatusDialog(false);
      setNewStatus('');
      setStatusNote('');
      setRejectionReason('');
      fetchApplicationData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('حدث خطأ في تحديث الحالة');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!application) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ agent_notes: agentNotes })
        .eq('id', application.id);

      if (error) throw error;
      toast.success('تم حفظ الملاحظات بنجاح');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('حدث خطأ في حفظ الملاحظات');
    } finally {
      setUpdating(false);
    }
  };

  const downloadDocument = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('حدث خطأ في تحميل المستند');
    }
  };

  const updateDocumentStatus = async (docId: string, status: 'verified' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('application_documents')
        .update({ 
          status,
          verified_by: currentUserProfile?.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', docId);

      if (error) throw error;
      toast.success(status === 'verified' ? 'تم التحقق من المستند' : 'تم رفض المستند');
      fetchApplicationData();
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('حدث خطأ في تحديث حالة المستند');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
      draft: { label: 'مسودة', className: 'bg-muted text-muted-foreground', icon: Clock },
      pending_payment: { label: 'بانتظار الدفع', className: 'bg-warning/10 text-warning', icon: Clock },
      submitted: { label: 'مقدم', className: 'bg-info/10 text-info', icon: FileText },
      under_review: { label: 'قيد المراجعة', className: 'bg-primary/10 text-primary', icon: Clock },
      documents_required: { label: 'مستندات مطلوبة', className: 'bg-warning/10 text-warning', icon: AlertCircle },
      processing: { label: 'قيد المعالجة', className: 'bg-primary/10 text-primary', icon: Clock },
      approved: { label: 'معتمد', className: 'bg-success/10 text-success', icon: CheckCircle },
      rejected: { label: 'مرفوض', className: 'bg-destructive/10 text-destructive', icon: XCircle },
      cancelled: { label: 'ملغي', className: 'bg-muted text-muted-foreground', icon: XCircle },
    };
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${config.className}`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">لم يتم العثور على الطلب</p>
        <Button asChild className="mt-4">
          <Link to="/agent/applications">
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للقائمة
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link to="/agent/applications">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">تفاصيل الطلب</h2>
            <p className="text-muted-foreground font-mono text-sm">{application.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(application.status)}
          {application.status === 'approved' && (
            <Button 
              variant="outline" 
              onClick={() => generateApplicationPDF(application as any)}
            >
              <FileDown className="h-4 w-4 ml-2" />
              تحميل PDF
            </Button>
          )}
          <Button onClick={() => setShowStatusDialog(true)}>
            تغيير الحالة
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                معلومات مقدم الطلب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoRow label="الاسم الكامل" value={application.profile?.full_name} />
                <InfoRow label="رقم الجوال" value={application.profile?.phone} />
                <InfoRow label="الجنسية" value={application.profile?.nationality} />
                <InfoRow label="تاريخ الميلاد" value={application.profile?.date_of_birth ? format(new Date(application.profile.date_of_birth), 'dd/MM/yyyy') : '-'} />
                <InfoRow label="رقم الجواز" value={application.profile?.passport_number} />
                <InfoRow label="تاريخ انتهاء الجواز" value={application.profile?.passport_expiry ? format(new Date(application.profile.passport_expiry), 'dd/MM/yyyy') : '-'} />
              </div>
            </CardContent>
          </Card>

          {/* Travel Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                معلومات السفر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoRow label="الوجهة" value={application.visa_type?.country?.name} />
                <InfoRow label="نوع التأشيرة" value={application.visa_type?.name} />
                <InfoRow label="تاريخ السفر" value={application.travel_date ? format(new Date(application.travel_date), 'dd/MM/yyyy') : '-'} />
                <InfoRow label="تاريخ العودة" value={application.return_date ? format(new Date(application.return_date), 'dd/MM/yyyy') : '-'} />
                <InfoRow label="الغرض من السفر" value={application.purpose_of_travel} className="md:col-span-2" />
                <InfoRow label="تفاصيل الإقامة" value={application.accommodation_details} className="md:col-span-2" />
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                المستندات المرفقة ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">لا توجد مستندات مرفقة</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.document_type}</p>
                          <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                          doc.status === 'verified' 
                            ? 'bg-success/10 text-success' 
                            : doc.status === 'rejected'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {doc.status === 'verified' ? 'تم التحقق' : doc.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => downloadDocument(doc)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        {doc.status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => updateDocumentStatus(doc.id, 'verified')}>
                              <CheckCircle className="h-4 w-4 text-success" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateDocumentStatus(doc.id, 'rejected')}>
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Agent Notes */}
          <Card>
            <CardHeader>
              <CardTitle>ملاحظات الوكيل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="أضف ملاحظاتك هنا..."
                value={agentNotes}
                onChange={(e) => setAgentNotes(e.target.value)}
                rows={5}
              />
              <Button onClick={handleSaveNotes} disabled={updating} className="w-full">
                <Save className="h-4 w-4 ml-2" />
                حفظ الملاحظات
              </Button>
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                سجل الحالات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">لا يوجد سجل</p>
              ) : (
                <div className="space-y-4">
                  {statusHistory.map((history) => (
                    <div key={history.id} className="border-r-2 border-primary pr-4">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(history.new_status)}
                      </div>
                      {history.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{history.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(history.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Info */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="تاريخ الإنشاء" value={format(new Date(application.created_at), 'dd MMM yyyy', { locale: ar })} />
              <InfoRow label="السعر" value={`${application.visa_type?.price} ر.س`} />
              <InfoRow label="مدة المعالجة" value={`${application.visa_type?.processing_days} أيام`} />
              {application.rejection_reason && (
                <div className="rounded-lg bg-destructive/10 p-3">
                  <p className="text-sm font-medium text-destructive">سبب الرفض:</p>
                  <p className="text-sm">{application.rejection_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغيير حالة الطلب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الحالة الجديدة</label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ApplicationStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newStatus === 'rejected' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">سبب الرفض</label>
                <Textarea
                  placeholder="اذكر سبب رفض الطلب..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">ملاحظات (اختياري)</label>
              <Textarea
                placeholder="أضف ملاحظات حول تغيير الحالة..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleStatusChange} 
              disabled={!newStatus || updating || (newStatus === 'rejected' && !rejectionReason)}
            >
              {updating && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
