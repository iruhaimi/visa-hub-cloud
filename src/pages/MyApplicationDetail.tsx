import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ApplicationMessages } from '@/components/messages/ApplicationMessages';
import { StatusProgressTracker } from '@/components/application/StatusProgressTracker';
import { DocumentsSection } from '@/components/application/DocumentsSection';
import { StatusHistoryTimeline } from '@/components/application/StatusHistoryTimeline';
import { PaymentSummary } from '@/components/application/PaymentSummary';
import {
  ArrowRight, MapPin, Calendar, Clock, CheckCircle2, XCircle,
  AlertCircle, FileText, Plane, Send, Eye, CreditCard, Ban
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import type { ApplicationStatus } from '@/types/database';

const STATUS_CONFIG: Record<ApplicationStatus, {
  icon: React.ComponentType<{ className?: string }>;
  labelAr: string;
  labelEn: string;
  className: string;
}> = {
  draft: { icon: FileText, labelAr: 'مسودة', labelEn: 'Draft', className: 'bg-muted text-muted-foreground' },
  pending_payment: { icon: CreditCard, labelAr: 'بانتظار الدفع', labelEn: 'Pending Payment', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  submitted: { icon: Send, labelAr: 'تم الإرسال', labelEn: 'Submitted', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  whatsapp_pending: { icon: Clock, labelAr: 'بانتظار التواصل عبر الواتساب', labelEn: 'WhatsApp Pending', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  under_review: { icon: Eye, labelAr: 'قيد المراجعة', labelEn: 'Under Review', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  documents_required: { icon: AlertCircle, labelAr: 'مستندات مطلوبة', labelEn: 'Documents Required', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  processing: { icon: Clock, labelAr: 'قيد المعالجة', labelEn: 'Processing', className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  approved: { icon: CheckCircle2, labelAr: 'تمت الموافقة', labelEn: 'Approved', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { icon: XCircle, labelAr: 'مرفوض', labelEn: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  cancelled: { icon: Ban, labelAr: 'ملغي', labelEn: 'Cancelled', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
};

interface ApplicationData {
  id: string;
  display_number: string | null;
  status: ApplicationStatus;
  travel_date: string | null;
  return_date: string | null;
  created_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  visa_type: {
    name: string;
    processing_days: number;
    country: {
      name: string;
      flag_url: string | null;
      expected_appointment_date: string | null;
      expected_appointment_note: string | null;
    };
  };
  assigned_agent: {
    full_name: string;
  } | null;
}

export default function MyApplicationDetail() {
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('id');
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const navigate = useNavigate();

  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!applicationId) { navigate('/my-applications', { replace: true }); return; }
    if (user) fetchApplication();
  }, [applicationId, user]);

  const fetchApplication = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          display_number,
          status,
          travel_date,
          return_date,
          created_at,
          submitted_at,
          approved_at,
          rejection_reason,
          visa_type:visa_types(
            name,
            processing_days,
            country:countries(name, flag_url, expected_appointment_date, expected_appointment_note)
          ),
          assigned_agent:profiles!applications_assigned_agent_id_fkey(full_name)
        `)
        .eq('id', applicationId)
        .maybeSingle();

      if (error) throw error;
      if (!data) { setError(isRTL ? 'لم يتم العثور على الطلب' : 'Application not found'); return; }
      setApplication(data as unknown as ApplicationData);
    } catch (err) {
      console.error('Error fetching application:', err);
      setError(isRTL ? 'حدث خطأ في تحميل البيانات' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd MMM yyyy', { locale: isRTL ? ar : enUS });
  };

  if (!user) {
    return (
      <div className="container-section py-12">
        <Card><CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{isRTL ? 'يرجى تسجيل الدخول لعرض تفاصيل الطلب' : 'Please login to view application details'}</p>
          <Button asChild className="mt-4"><Link to="/auth">{isRTL ? 'تسجيل الدخول' : 'Login'}</Link></Button>
        </CardContent></Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-section py-12">
        <Card><CardHeader><Skeleton className="h-8 w-64" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="container-section py-12">
        <Card><CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-destructive">{error || (isRTL ? 'لم يتم العثور على الطلب' : 'Application not found')}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/my-applications"><ArrowRight className="h-4 w-4 ml-2" />{isRTL ? 'العودة لطلباتي' : 'Back to My Applications'}</Link>
          </Button>
        </CardContent></Card>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[application.status];
  const StatusIcon = statusConfig.icon;
  const displayId = application.display_number || application.id.slice(0, 8).toUpperCase();

  return (
    <div className="container-section py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link to="/my-applications"><ArrowRight className={`h-5 w-5 ${!isRTL && 'rotate-180'}`} /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{isRTL ? 'تفاصيل الطلب' : 'Application Details'}</h1>
              <p className="text-primary font-mono font-bold text-sm">{displayId}</p>
            </div>
          </div>
          <Badge className={`${statusConfig.className} gap-1.5 px-3 py-1.5`}>
            <StatusIcon className="h-4 w-4" />
            {isRTL ? statusConfig.labelAr : statusConfig.labelEn}
          </Badge>
        </div>

        {/* Status Progress Tracker */}
        <Card>
          <CardContent className="pt-6 pb-4">
            <StatusProgressTracker status={application.status} />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Main Info */}
          <div className="lg:col-span-3 space-y-6">
            {/* Visa Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plane className="h-5 w-5 text-primary" />
                  {isRTL ? 'معلومات التأشيرة' : 'Visa Information'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  {application.visa_type?.country?.flag_url && (
                    <img src={application.visa_type.country.flag_url} alt="" className="w-16 h-12 object-cover rounded-lg shadow" />
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{application.visa_type?.country?.name}</h3>
                    <p className="text-muted-foreground">{application.visa_type?.name}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'تاريخ السفر المتوقع' : 'Expected Travel Date'}</p>
                      <p className="font-medium">{formatDate(application.travel_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'تاريخ العودة' : 'Return Date'}</p>
                      <p className="font-medium">{formatDate(application.return_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'تاريخ التقديم' : 'Submitted At'}</p>
                      <p className="font-medium">{formatDate(application.submitted_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'مدة المعالجة' : 'Processing Time'}</p>
                      <p className="font-medium">{application.visa_type?.processing_days} {isRTL ? 'يوم عمل' : 'business days'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expected Appointment Date */}
            {application.visa_type?.country?.expected_appointment_date && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-primary">{isRTL ? 'الموعد المتوقع للسفارة' : 'Expected Embassy Appointment'}</p>
                      <p className="text-sm mt-1 font-bold">{application.visa_type.country.expected_appointment_date}</p>
                      {application.visa_type.country.expected_appointment_note && (
                        <p className="text-xs mt-1 text-muted-foreground">{application.visa_type.country.expected_appointment_note}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rejection Reason */}
            {application.status === 'rejected' && application.rejection_reason && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">{isRTL ? 'سبب الرفض:' : 'Rejection Reason:'}</p>
                      <p className="text-sm mt-1 text-destructive/80">{application.rejection_reason}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Approval Info */}
            {application.status === 'approved' && application.approved_at && (
              <Card className="border-green-500/50 bg-green-50 dark:bg-green-900/10">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">{isRTL ? 'تمت الموافقة بنجاح!' : 'Approved Successfully!'}</p>
                      <p className="text-sm mt-1 text-green-600/80">{isRTL ? 'تاريخ الموافقة: ' : 'Approval Date: '}{formatDate(application.approved_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents Section */}
            <DocumentsSection applicationId={application.id} />

            {/* Payment Summary */}
            <PaymentSummary applicationId={application.id} applicationStatus={application.status} />

            {/* Status History */}
            <StatusHistoryTimeline applicationId={application.id} />
          </div>

          {/* Sidebar - Messages */}
          <div className="lg:col-span-2">
            {application.assigned_agent ? (
              <ApplicationMessages applicationId={application.id} agentName={application.assigned_agent.full_name} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Send className="h-5 w-5 text-muted-foreground" />
                    {isRTL ? 'المراسلات' : 'Messages'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'ستتمكن من التواصل مع الوكيل بعد تعيينه للطلب' : 'You can contact the agent once assigned to your application'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
