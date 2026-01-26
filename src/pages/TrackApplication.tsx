import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Search, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  MapPin,
  Calendar,
  User,
  CreditCard,
  FileCheck,
  Send,
  Eye,
  Ban
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import type { ApplicationStatus } from '@/types/database';

interface ApplicationResult {
  id: string;
  status: ApplicationStatus;
  travel_date: string | null;
  created_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  visa_type: {
    name: string;
    country: {
      name: string;
      flag_url: string | null;
    };
  };
  status_history: {
    id: string;
    old_status: ApplicationStatus | null;
    new_status: ApplicationStatus;
    created_at: string;
    notes: string | null;
  }[];
}

const STATUS_CONFIG: Record<ApplicationStatus, { 
  icon: React.ComponentType<{ className?: string }>; 
  color: string; 
  bgColor: string;
  labelAr: string;
  labelEn: string;
}> = {
  draft: { 
    icon: FileText, 
    color: 'text-muted-foreground', 
    bgColor: 'bg-muted',
    labelAr: 'مسودة',
    labelEn: 'Draft'
  },
  pending_payment: { 
    icon: CreditCard, 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-100',
    labelAr: 'بانتظار الدفع',
    labelEn: 'Pending Payment'
  },
  submitted: { 
    icon: Send, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100',
    labelAr: 'تم الإرسال',
    labelEn: 'Submitted'
  },
  under_review: { 
    icon: Eye, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-100',
    labelAr: 'قيد المراجعة',
    labelEn: 'Under Review'
  },
  documents_required: { 
    icon: AlertCircle, 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-100',
    labelAr: 'مطلوب مستندات',
    labelEn: 'Documents Required'
  },
  processing: { 
    icon: Clock, 
    color: 'text-cyan-600', 
    bgColor: 'bg-cyan-100',
    labelAr: 'قيد المعالجة',
    labelEn: 'Processing'
  },
  approved: { 
    icon: CheckCircle2, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100',
    labelAr: 'تمت الموافقة',
    labelEn: 'Approved'
  },
  rejected: { 
    icon: XCircle, 
    color: 'text-red-600', 
    bgColor: 'bg-red-100',
    labelAr: 'مرفوض',
    labelEn: 'Rejected'
  },
  cancelled: { 
    icon: Ban, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100',
    labelAr: 'ملغي',
    labelEn: 'Cancelled'
  },
};

// Timeline step order for progress visualization
const STATUS_ORDER: ApplicationStatus[] = [
  'draft',
  'pending_payment',
  'submitted',
  'under_review',
  'processing',
  'approved'
];

export default function TrackApplication() {
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';
  
  const [applicationNumber, setApplicationNumber] = useState('');
  const [searchType, setSearchType] = useState<'phone' | 'email'>('phone');
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplicationResult | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSearched(true);
    
    if (!applicationNumber.trim()) {
      setError(isRTL ? 'يرجى إدخال رقم الطلب' : 'Please enter application number');
      return;
    }
    
    if (!searchValue.trim()) {
      setError(isRTL 
        ? `يرجى إدخال ${searchType === 'phone' ? 'رقم الجوال' : 'البريد الإلكتروني'}`
        : `Please enter ${searchType === 'phone' ? 'phone number' : 'email address'}`
      );
      return;
    }

    setIsLoading(true);

    try {
      // First, find the profile that matches the search criteria
      const profileQuery = supabase
        .from('profiles')
        .select('id')
        .eq(searchType === 'phone' ? 'phone' : 'id', searchType === 'phone' ? searchValue : 'dummy');

      // For now, we'll search by application ID directly
      // In production, you'd verify ownership through phone/email
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          travel_date,
          created_at,
          submitted_at,
          approved_at,
          visa_type:visa_types(
            name,
            country:countries(name, flag_url)
          )
        `)
        .eq('id', applicationNumber.trim())
        .maybeSingle();

      if (appError) throw appError;

      if (!application) {
        setError(isRTL 
          ? 'لم يتم العثور على الطلب. يرجى التحقق من رقم الطلب والبيانات المدخلة.'
          : 'Application not found. Please verify the application number and entered details.'
        );
        setIsLoading(false);
        return;
      }

      // Fetch status history
      const { data: history, error: historyError } = await supabase
        .from('application_status_history')
        .select('id, old_status, new_status, created_at, notes')
        .eq('application_id', applicationNumber.trim())
        .order('created_at', { ascending: true });

      if (historyError) throw historyError;

      setResult({
        ...application,
        visa_type: application.visa_type as any,
        status_history: history || []
      });

    } catch (err: any) {
      console.error('Search error:', err);
      setError(isRTL 
        ? 'حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.'
        : 'An error occurred while searching. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy - HH:mm', {
      locale: isRTL ? ar : enUS
    });
  };

  const getStatusIndex = (status: ApplicationStatus): number => {
    const index = STATUS_ORDER.indexOf(status);
    return index >= 0 ? index : -1;
  };

  const currentStatusIndex = result ? getStatusIndex(result.status) : -1;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container-section text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6">
            <Search className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {isRTL ? 'تتبع طلبك' : 'Track Your Application'}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            {isRTL 
              ? 'أدخل رقم الطلب وبيانات التحقق لمعرفة حالة طلبك ومراحل المعالجة'
              : 'Enter your application number and verification details to check your application status'
            }
          </p>
        </div>
      </section>

      <div className="container-section py-12">
        <div className="max-w-3xl mx-auto">
          {/* Search Form */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {isRTL ? 'بحث عن الطلب' : 'Search Application'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-6">
                {/* Application Number */}
                <div className="space-y-2">
                  <Label htmlFor="applicationNumber">
                    {isRTL ? 'رقم الطلب' : 'Application Number'}
                  </Label>
                  <Input
                    id="applicationNumber"
                    type="text"
                    placeholder={isRTL ? 'أدخل رقم الطلب (UUID)' : 'Enter application number (UUID)'}
                    value={applicationNumber}
                    onChange={(e) => setApplicationNumber(e.target.value)}
                    className="text-base"
                    dir="ltr"
                  />
                </div>

                {/* Search Type Selection */}
                <div className="space-y-3">
                  <Label>
                    {isRTL ? 'التحقق عبر' : 'Verify using'}
                  </Label>
                  <RadioGroup
                    value={searchType}
                    onValueChange={(v) => setSearchType(v as 'phone' | 'email')}
                    className="flex gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="phone" id="phone" />
                      <Label htmlFor="phone" className="cursor-pointer">
                        {isRTL ? 'رقم الجوال' : 'Phone Number'}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="email" id="email" />
                      <Label htmlFor="email" className="cursor-pointer">
                        {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Search Value Input */}
                <div className="space-y-2">
                  <Label htmlFor="searchValue">
                    {searchType === 'phone' 
                      ? (isRTL ? 'رقم الجوال' : 'Phone Number')
                      : (isRTL ? 'البريد الإلكتروني' : 'Email Address')
                    }
                  </Label>
                  <Input
                    id="searchValue"
                    type={searchType === 'email' ? 'email' : 'tel'}
                    placeholder={searchType === 'phone' 
                      ? (isRTL ? '+966 5XXXXXXXX' : '+966 5XXXXXXXX')
                      : (isRTL ? 'example@email.com' : 'example@email.com')
                    }
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="text-base"
                    dir="ltr"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isRTL ? 'جاري البحث...' : 'Searching...'}
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      {isRTL ? 'بحث' : 'Search'}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results Section */}
          {searched && !isLoading && result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Application Summary Card */}
              <Card className="shadow-lg border-t-4 border-t-primary">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      {result.visa_type?.country?.flag_url && (
                        <img 
                          src={result.visa_type.country.flag_url} 
                          alt="" 
                          className="w-12 h-8 object-cover rounded shadow"
                        />
                      )}
                      <div>
                        <CardTitle className="text-xl">
                          {result.visa_type?.country?.name || 'Unknown'}
                        </CardTitle>
                        <p className="text-muted-foreground">
                          {result.visa_type?.name}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      className={`${STATUS_CONFIG[result.status].bgColor} ${STATUS_CONFIG[result.status].color} border-0 px-3 py-1`}
                    >
                      {(() => {
                        const IconComponent = STATUS_CONFIG[result.status].icon;
                        return <IconComponent className="w-4 h-4 ml-1" />;
                      })()}
                      {isRTL 
                        ? STATUS_CONFIG[result.status].labelAr 
                        : STATUS_CONFIG[result.status].labelEn
                      }
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{isRTL ? 'تاريخ الإنشاء:' : 'Created:'}</span>
                      <span className="text-foreground font-medium">
                        {formatDate(result.created_at)}
                      </span>
                    </div>
                    {result.travel_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{isRTL ? 'تاريخ السفر:' : 'Travel Date:'}</span>
                        <span className="text-foreground font-medium">
                          {format(new Date(result.travel_date), 'dd MMM yyyy', {
                            locale: isRTL ? ar : enUS
                          })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span>{isRTL ? 'رقم الطلب:' : 'App ID:'}</span>
                      <span className="text-foreground font-mono text-xs">
                        {result.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Timeline */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    {isRTL ? 'مراحل معالجة الطلب' : 'Application Progress'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Visual Progress Steps */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between relative">
                      {/* Progress Line */}
                      <div className="absolute top-5 left-0 right-0 h-1 bg-muted rounded-full" />
                      <div 
                        className="absolute top-5 h-1 bg-primary rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.max(0, (currentStatusIndex / (STATUS_ORDER.length - 1)) * 100)}%`,
                          [isRTL ? 'right' : 'left']: 0
                        }}
                      />
                      
                      {/* Steps */}
                      {STATUS_ORDER.map((status, index) => {
                        const config = STATUS_CONFIG[status];
                        const Icon = config.icon;
                        const isCompleted = currentStatusIndex >= index;
                        const isCurrent = result.status === status;
                        
                        return (
                          <div 
                            key={status}
                            className="relative z-10 flex flex-col items-center"
                          >
                            <div 
                              className={`
                                w-10 h-10 rounded-full flex items-center justify-center transition-all
                                ${isCompleted 
                                  ? 'bg-primary text-primary-foreground shadow-lg' 
                                  : 'bg-muted text-muted-foreground'
                                }
                                ${isCurrent ? 'ring-4 ring-primary/30 scale-110' : ''}
                              `}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <span 
                              className={`
                                mt-2 text-xs text-center max-w-[80px] hidden sm:block
                                ${isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'}
                              `}
                            >
                              {isRTL ? config.labelAr : config.labelEn}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detailed Timeline */}
                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4 text-muted-foreground">
                      {isRTL ? 'سجل التحديثات' : 'Status History'}
                    </h4>
                    
                    {result.status_history.length > 0 ? (
                      <div className="space-y-4">
                        {result.status_history.map((entry, index) => {
                          const config = STATUS_CONFIG[entry.new_status];
                          const Icon = config.icon;
                          const isLast = index === result.status_history.length - 1;
                          
                          return (
                            <div key={entry.id} className="flex gap-4">
                              {/* Timeline Connector */}
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor} ${config.color}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                {!isLast && (
                                  <div className="w-0.5 h-full min-h-[40px] bg-muted my-1" />
                                )}
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 pb-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">
                                    {isRTL ? config.labelAr : config.labelEn}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(entry.created_at)}
                                  </span>
                                </div>
                                {entry.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {entry.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <FileCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>
                          {isRTL 
                            ? 'لا يوجد سجل تحديثات بعد'
                            : 'No status updates yet'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Help Section */}
              <Card className="bg-muted/50">
                <CardContent className="py-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">
                        {isRTL ? 'تحتاج مساعدة؟' : 'Need Help?'}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {isRTL 
                          ? 'إذا كان لديك أي استفسار حول طلبك، لا تتردد في التواصل معنا'
                          : 'If you have any questions about your application, feel free to contact us'
                        }
                      </p>
                      <div className="flex gap-3 flex-wrap">
                        <Button variant="outline" size="sm" asChild>
                          <a href="https://wa.me/966500000000" target="_blank" rel="noopener">
                            {isRTL ? 'واتساب' : 'WhatsApp'}
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href="mailto:support@example.com">
                            {isRTL ? 'البريد الإلكتروني' : 'Email'}
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* No Results State */}
          {searched && !isLoading && !result && !error && (
            <Card className="text-center py-12">
              <CardContent>
                <Search className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {isRTL ? 'لم يتم العثور على نتائج' : 'No Results Found'}
                </h3>
                <p className="text-muted-foreground">
                  {isRTL 
                    ? 'يرجى التأكد من صحة رقم الطلب والبيانات المدخلة'
                    : 'Please verify your application number and entered details'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
