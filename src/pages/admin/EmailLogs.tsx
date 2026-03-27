import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Mail, CheckCircle, XCircle, AlertTriangle, Search, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface EmailLog {
  id: string;
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  suppressed: number;
}

const TIME_RANGES = [
  { label: 'آخر 24 ساعة', days: 1 },
  { label: 'آخر 7 أيام', days: 7 },
  { label: 'آخر 30 يوم', days: 30 },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'الكل' },
  { value: 'sent', label: 'مُرسل' },
  { value: 'pending', label: 'قيد الإرسال' },
  { value: 'failed', label: 'فشل' },
  { value: 'dlq', label: 'فشل نهائي' },
  { value: 'suppressed', label: 'محظور' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'sent':
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">مُرسل</Badge>;
    case 'pending':
      return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">قيد الإرسال</Badge>;
    case 'failed':
    case 'dlq':
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">فشل</Badge>;
    case 'suppressed':
      return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">محظور</Badge>;
    case 'bounced':
      return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">مرتد</Badge>;
    case 'complained':
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">شكوى</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getTemplateName = (name: string) => {
  const map: Record<string, string> = {
    'task-assignment': 'تعيين مهمة',
    'auth_emails': 'بريد المصادقة',
    'system': 'النظام',
  };
  return map[name] || name;
};

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, sent: 0, failed: 0, pending: 0, suppressed: 0 });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - timeRange);

      // Fetch logs - get latest status per message_id
      let query = supabase
        .from('email_send_log')
        .select('*')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchQuery.trim()) {
        query = query.ilike('recipient_email', `%${searchQuery.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Deduplicate by message_id (keep latest)
      const deduped = new Map<string, EmailLog>();
      for (const log of (data || [])) {
        const key = log.message_id || log.id;
        if (!deduped.has(key) || new Date(log.created_at) > new Date(deduped.get(key)!.created_at)) {
          deduped.set(key, log);
        }
      }
      setLogs(Array.from(deduped.values()));

      // Fetch stats
      const { data: allLogs } = await supabase
        .from('email_send_log')
        .select('message_id, status, created_at')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false });

      const statsDeduped = new Map<string, string>();
      for (const log of (allLogs || [])) {
        const key = log.message_id || log.created_at;
        if (!statsDeduped.has(key)) {
          statsDeduped.set(key, log.status);
        }
      }

      const s: Stats = { total: 0, sent: 0, failed: 0, pending: 0, suppressed: 0 };
      for (const status of statsDeduped.values()) {
        s.total++;
        if (status === 'sent') s.sent++;
        else if (status === 'failed' || status === 'dlq') s.failed++;
        else if (status === 'pending') s.pending++;
        else if (status === 'suppressed') s.suppressed++;
      }
      setStats(s);
    } catch (error) {
      console.error('Error fetching email logs:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, statusFilter, searchQuery, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            سجل الإيميلات المرسلة
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            جميع الإيميلات المرسلة من النظام
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Mail className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">إجمالي</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <CheckCircle className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
            <p className="text-xs text-muted-foreground">مُرسل</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <XCircle className="h-5 w-5 mx-auto text-red-500 mb-1" />
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-xs text-muted-foreground">فشل</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-2xl font-bold text-yellow-600">{stats.suppressed}</p>
            <p className="text-xs text-muted-foreground">محظور</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-1">
              {TIME_RANGES.map(r => (
                <Button
                  key={r.days}
                  variant={timeRange === r.days ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setTimeRange(r.days); setPage(0); }}
                >
                  {r.label}
                </Button>
              ))}
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالبريد الإلكتروني..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
                className="pr-9"
                dir="ltr"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد إيميلات في هذه الفترة</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النوع</TableHead>
                  <TableHead>المستلم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الخطأ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {getTemplateName(log.template_name)}
                    </TableCell>
                    <TableCell dir="ltr" className="text-left text-sm">
                      {log.recipient_email}
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: ar })}
                    </TableCell>
                    <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                      {log.error_message || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {logs.length >= PAGE_SIZE && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
            السابق
          </Button>
          <span className="text-sm text-muted-foreground self-center">صفحة {page + 1}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={logs.length < PAGE_SIZE}>
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}
