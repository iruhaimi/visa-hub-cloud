import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Eye, 
  Filter,
  Loader2,
  RefreshCw,
  Calendar,
  MapPin,
  X,
  FileText,
  Clock
} from 'lucide-react';
import { format, isAfter, isBefore, startOfDay, endOfDay, subDays, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';

const STATUS_OPTIONS = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'submitted', label: 'مقدم' },
  { value: 'under_review', label: 'قيد المراجعة' },
  { value: 'documents_required', label: 'مستندات مطلوبة' },
  { value: 'processing', label: 'قيد المعالجة' },
  { value: 'approved', label: 'معتمد' },
  { value: 'rejected', label: 'مرفوض' },
];

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'كل الفترات' },
  { value: 'today', label: 'اليوم' },
  { value: 'week', label: 'آخر 7 أيام' },
  { value: 'month', label: 'آخر 30 يوم' },
  { value: '3months', label: 'آخر 3 أشهر' },
];

interface Application {
  id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  travel_date: string | null;
  user_id: string;
  visa_type: {
    name: string;
    country: {
      id: string;
      name: string;
    };
  };
  profile: {
    full_name: string;
    phone: string;
  };
}

interface Country {
  id: string;
  name: string;
}

export default function AgentApplicationsList() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    const { data } = await supabase
      .from('countries')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    
    setCountries(data || []);
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          submitted_at,
          travel_date,
          user_id,
          visa_type:visa_types(
            name,
            country:countries(id, name)
          ),
          profile:profiles!applications_user_id_fkey(
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (countryFilter !== 'all') count++;
    if (dateRangeFilter !== 'all') count++;
    if (searchQuery) count++;
    return count;
  }, [statusFilter, countryFilter, dateRangeFilter, searchQuery]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCountryFilter('all');
    setDateRangeFilter('all');
  };

  // Filter applications
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          app.id.toLowerCase().includes(searchLower) ||
          app.profile?.full_name?.toLowerCase().includes(searchLower) ||
          app.profile?.phone?.includes(searchQuery) ||
          app.visa_type?.country?.name?.toLowerCase().includes(searchLower) ||
          app.visa_type?.name?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && app.status !== statusFilter) {
        return false;
      }

      // Country filter
      if (countryFilter !== 'all' && app.visa_type?.country?.id !== countryFilter) {
        return false;
      }

      // Date range filter
      if (dateRangeFilter !== 'all') {
        const appDate = new Date(app.created_at);
        const now = new Date();
        
        switch (dateRangeFilter) {
          case 'today':
            if (!isAfter(appDate, startOfDay(now)) || !isBefore(appDate, endOfDay(now))) {
              return false;
            }
            break;
          case 'week':
            if (isBefore(appDate, subDays(now, 7))) return false;
            break;
          case 'month':
            if (isBefore(appDate, subDays(now, 30))) return false;
            break;
          case '3months':
            if (isBefore(appDate, subMonths(now, 3))) return false;
            break;
        }
      }

      return true;
    });
  }, [applications, searchQuery, statusFilter, countryFilter, dateRangeFilter]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: 'مسودة', variant: 'secondary' },
      pending_payment: { label: 'بانتظار الدفع', variant: 'outline' },
      submitted: { label: 'مقدم', variant: 'default' },
      under_review: { label: 'قيد المراجعة', variant: 'default' },
      documents_required: { label: 'مستندات مطلوبة', variant: 'outline' },
      processing: { label: 'قيد المعالجة', variant: 'default' },
      approved: { label: 'معتمد', variant: 'default' },
      rejected: { label: 'مرفوض', variant: 'destructive' },
      cancelled: { label: 'ملغي', variant: 'secondary' },
    };
    const config = statusConfig[status] || statusConfig.draft;
    
    const colorClasses: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      pending_payment: 'bg-warning/10 text-warning border-warning/30',
      submitted: 'bg-info/10 text-info',
      under_review: 'bg-primary/10 text-primary',
      documents_required: 'bg-warning/10 text-warning border-warning/30',
      processing: 'bg-primary/10 text-primary',
      approved: 'bg-success/10 text-success',
      rejected: 'bg-destructive/10 text-destructive',
      cancelled: 'bg-muted text-muted-foreground',
    };
    
    return (
      <Badge variant={config.variant} className={colorClasses[status] || ''}>
        {config.label}
      </Badge>
    );
  };

  // Stats
  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(a => ['submitted', 'under_review', 'documents_required', 'processing'].includes(a.status)).length;
    const approved = applications.filter(a => a.status === 'approved').length;
    const rejected = applications.filter(a => a.status === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [applications]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">طلباتي</h2>
          <p className="text-muted-foreground">عرض وإدارة الطلبات المعينة لك</p>
        </div>
        <Button onClick={fetchApplications} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">قيد المعالجة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <FileText className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">معتمدة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <FileText className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-xs text-muted-foreground">مرفوضة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              البحث والفلترة
            </CardTitle>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
                <X className="h-4 w-4 ml-1" />
                مسح الفلاتر ({activeFiltersCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم، الجوال، رقم الطلب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Country Filter */}
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="الوجهة" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الوجهات</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="الفترة" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span>الطلبات ({filteredApplications.length})</span>
            {filteredApplications.length !== applications.length && (
              <span className="text-sm font-normal text-muted-foreground">
                من أصل {applications.length} طلب
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                {applications.length === 0 
                  ? 'لا توجد طلبات معينة لك حالياً'
                  : 'لا توجد نتائج مطابقة للفلاتر المحددة'}
              </p>
              {activeFiltersCount > 0 && (
                <Button variant="link" onClick={clearAllFilters} className="mt-2">
                  مسح جميع الفلاتر
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الطلب</TableHead>
                    <TableHead className="text-right">مقدم الطلب</TableHead>
                    <TableHead className="text-right">الوجهة</TableHead>
                    <TableHead className="text-right">نوع التأشيرة</TableHead>
                    <TableHead className="text-right">تاريخ التقديم</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">
                        {app.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{app.profile?.full_name || 'غير محدد'}</p>
                          <p className="text-xs text-muted-foreground">{app.profile?.phone || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {app.visa_type?.country?.name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>{app.visa_type?.name || '-'}</TableCell>
                      <TableCell>
                        {app.submitted_at 
                          ? format(new Date(app.submitted_at), 'dd MMM yyyy', { locale: ar })
                          : format(new Date(app.created_at), 'dd MMM yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/agent/applications/${app.id}`}>
                            <Eye className="h-4 w-4 ml-1" />
                            عرض
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
