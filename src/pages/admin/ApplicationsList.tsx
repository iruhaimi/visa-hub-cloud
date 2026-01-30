import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { 
  Search, 
  Eye, 
  Filter,
  Loader2,
  RefreshCw,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { exportToExcel } from '@/lib/exportToExcel';

const STATUS_OPTIONS = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'draft', label: 'مسودة' },
  { value: 'pending_payment', label: 'بانتظار الدفع' },
  { value: 'submitted', label: 'مقدم' },
  { value: 'under_review', label: 'قيد المراجعة' },
  { value: 'documents_required', label: 'مستندات مطلوبة' },
  { value: 'processing', label: 'قيد المعالجة' },
  { value: 'approved', label: 'معتمد' },
  { value: 'rejected', label: 'مرفوض' },
  { value: 'cancelled', label: 'ملغي' },
];

interface Application {
  id: string;
  status: string;
  created_at: string;
  travel_date: string | null;
  user_id: string;
  visa_type: {
    name: string;
    country: {
      name: string;
    };
  };
  profile: {
    full_name: string;
    phone: string;
  };
}

export default function ApplicationsList() {
  const { isAdmin } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          travel_date,
          user_id,
          visa_type:visa_types(
            name,
            country:countries(name)
          ),
          profile:profiles!applications_user_id_fkey(
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      app.id.toLowerCase().includes(searchLower) ||
      app.profile?.full_name?.toLowerCase().includes(searchLower) ||
      app.profile?.phone?.includes(searchQuery) ||
      app.visa_type?.country?.name?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      draft: 'مسودة',
      pending_payment: 'بانتظار الدفع',
      submitted: 'مقدم',
      under_review: 'قيد المراجعة',
      documents_required: 'مستندات مطلوبة',
      processing: 'قيد المعالجة',
      approved: 'معتمد',
      rejected: 'مرفوض',
      cancelled: 'ملغي',
    };
    return statusLabels[status] || status;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: 'مسودة', className: 'bg-muted text-muted-foreground' },
      pending_payment: { label: 'بانتظار الدفع', className: 'bg-warning/10 text-warning' },
      submitted: { label: 'مقدم', className: 'bg-info/10 text-info' },
      under_review: { label: 'قيد المراجعة', className: 'bg-primary/10 text-primary' },
      documents_required: { label: 'مستندات مطلوبة', className: 'bg-warning/10 text-warning' },
      processing: { label: 'قيد المعالجة', className: 'bg-primary/10 text-primary' },
      approved: { label: 'معتمد', className: 'bg-success/10 text-success' },
      rejected: { label: 'مرفوض', className: 'bg-destructive/10 text-destructive' },
      cancelled: { label: 'ملغي', className: 'bg-muted text-muted-foreground' },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleExportToExcel = async () => {
    const data = filteredApplications.map(app => ({
      id: app.id,
      full_name: app.profile?.full_name || 'غير محدد',
      phone: app.profile?.phone || '-',
      country: app.visa_type?.country?.name || '-',
      visa_type: app.visa_type?.name || '-',
      created_at: format(new Date(app.created_at), 'yyyy-MM-dd'),
      travel_date: app.travel_date ? format(new Date(app.travel_date), 'yyyy-MM-dd') : '-',
      status: getStatusLabel(app.status),
    }));

    await exportToExcel({
      sheetName: 'الطلبات',
      fileName: `applications_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`,
      columns: [
        { header: 'رقم الطلب', key: 'id', width: 40 },
        { header: 'اسم مقدم الطلب', key: 'full_name', width: 25 },
        { header: 'رقم الجوال', key: 'phone', width: 15 },
        { header: 'الوجهة', key: 'country', width: 15 },
        { header: 'نوع التأشيرة', key: 'visa_type', width: 20 },
        { header: 'تاريخ الإنشاء', key: 'created_at', width: 12 },
        { header: 'تاريخ السفر', key: 'travel_date', width: 12 },
        { header: 'الحالة', key: 'status', width: 15 },
      ],
      data,
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة الطلبات</h2>
          <p className="text-muted-foreground">عرض وإدارة جميع طلبات التأشيرات</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportToExcel} variant="outline" size="sm">
            <Download className="h-4 w-4 ml-2" />
            تصدير Excel
          </Button>
          <Button onClick={fetchApplications} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم، رقم الجوال، أو رقم الطلب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="فلترة حسب الحالة" />
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
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            الطلبات ({filteredApplications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد طلبات مطابقة للبحث
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
                    <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-mono text-xs">
                        {app.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{app.profile?.full_name || 'غير محدد'}</p>
                          <p className="text-xs text-muted-foreground">{app.profile?.phone || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{app.visa_type?.country?.name || '-'}</TableCell>
                      <TableCell>{app.visa_type?.name || '-'}</TableCell>
                      <TableCell>
                        {format(new Date(app.created_at), 'dd MMM yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="outline">
                          <Link to={`${isAdmin ? '/admin' : '/agent'}/applications/${app.id}`}>
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
