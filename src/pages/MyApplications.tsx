import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Calendar, 
  MapPin, 
  Clock, 
  Eye, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Plane
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import type { ApplicationStatus } from '@/types/database';

interface ApplicationWithVisa {
  id: string;
  status: ApplicationStatus;
  travel_date: string | null;
  created_at: string;
  submitted_at: string | null;
  visa_type: {
    id: string;
    name: string;
    country: {
      id: string;
      name: string;
      code: string;
      flag_url: string | null;
    };
  };
}

const MyApplications = () => {
  const { user, profile } = useAuth();
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  
  const [applications, setApplications] = useState<ApplicationWithVisa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const labels = {
    pageTitle: isRTL ? 'طلباتي' : 'My Applications',
    noApplications: isRTL ? 'لا توجد طلبات حتى الآن' : 'No applications yet',
    startApplication: isRTL ? 'ابدأ طلب جديد' : 'Start New Application',
    viewDetails: isRTL ? 'عرض التفاصيل' : 'View Details',
    applicationId: isRTL ? 'رقم الطلب' : 'Application ID',
    travelDate: isRTL ? 'تاريخ السفر' : 'Travel Date',
    submittedAt: isRTL ? 'تاريخ التقديم' : 'Submitted At',
    createdAt: isRTL ? 'تاريخ الإنشاء' : 'Created At',
    status: isRTL ? 'الحالة' : 'Status',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    error: isRTL ? 'حدث خطأ أثناء تحميل الطلبات' : 'Error loading applications',
    retry: isRTL ? 'إعادة المحاولة' : 'Retry',
    notScheduled: isRTL ? 'غير محدد' : 'Not scheduled',
  };

  const statusLabels: Record<ApplicationStatus, { ar: string; en: string }> = {
    draft: { ar: 'مسودة', en: 'Draft' },
    pending_payment: { ar: 'في انتظار الدفع', en: 'Pending Payment' },
    submitted: { ar: 'تم التقديم', en: 'Submitted' },
    under_review: { ar: 'قيد المراجعة', en: 'Under Review' },
    documents_required: { ar: 'مستندات مطلوبة', en: 'Documents Required' },
    processing: { ar: 'قيد المعالجة', en: 'Processing' },
    approved: { ar: 'تمت الموافقة', en: 'Approved' },
    rejected: { ar: 'مرفوض', en: 'Rejected' },
    cancelled: { ar: 'ملغى', en: 'Cancelled' },
  };

  const getStatusVariant = (status: ApplicationStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
      case 'cancelled':
        return 'destructive';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'processing':
      case 'under_review':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'documents_required':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const fetchApplications = async () => {
    if (!profile) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          travel_date,
          created_at,
          submitted_at,
          visa_type:visa_types (
            id,
            name,
            country:countries (
              id,
              name,
              code,
              flag_url
            )
          )
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setApplications(data as unknown as ApplicationWithVisa[]);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(isRTL ? 'حدث خطأ أثناء تحميل الطلبات' : 'Error loading applications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchApplications();
    }
  }, [profile]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return labels.notScheduled;
    return format(new Date(dateString), 'dd MMM yyyy', { 
      locale: isRTL ? ar : enUS 
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto py-16 px-4 text-center" dir={direction}>
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-4">
          {isRTL ? 'يرجى تسجيل الدخول' : 'Please Sign In'}
        </h1>
        <p className="text-muted-foreground mb-6">
          {isRTL ? 'يجب تسجيل الدخول لعرض طلباتك' : 'You need to sign in to view your applications'}
        </p>
        <Button asChild>
          <Link to="/auth">{isRTL ? 'تسجيل الدخول' : 'Sign In'}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4" dir={direction}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">{labels.pageTitle}</h1>
          </div>
          <Button asChild>
            <Link to="/destinations">
              <Plane className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {labels.startApplication}
            </Link>
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="border-destructive">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchApplications} variant="outline">
                <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {labels.retry}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && applications.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">{labels.noApplications}</h2>
              <p className="text-muted-foreground mb-6">
                {isRTL 
                  ? 'ابدأ بتقديم طلب تأشيرة جديد الآن'
                  : 'Start by submitting a new visa application'}
              </p>
              <Button asChild size="lg">
                <Link to="/destinations">
                  <Plane className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {labels.startApplication}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Applications List */}
        {!isLoading && !error && applications.length > 0 && (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Country Flag & Info */}
                    <div className="flex items-center gap-4 flex-1">
                      {app.visa_type?.country?.flag_url && (
                        <img
                          src={app.visa_type.country.flag_url}
                          alt={app.visa_type.country.name}
                          className="h-12 w-16 object-cover rounded-lg shadow-sm"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">
                          {app.visa_type?.country?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {app.visa_type?.name}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <Badge 
                      variant={getStatusVariant(app.status)}
                      className="flex items-center gap-1 w-fit"
                    >
                      {getStatusIcon(app.status)}
                      {statusLabels[app.status][isRTL ? 'ar' : 'en']}
                    </Badge>
                  </div>

                  {/* Details Row */}
                  <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{app.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {isRTL ? 'السفر: ' : 'Travel: '}
                        {formatDate(app.travel_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {isRTL ? 'تم الإنشاء: ' : 'Created: '}
                        {formatDate(app.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-4 flex justify-end">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/track?id=${app.id}`}>
                        <Eye className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {labels.viewDetails}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
