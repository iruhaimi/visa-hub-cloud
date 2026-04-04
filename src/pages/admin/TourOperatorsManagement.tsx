import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Search, Building2, CheckCircle, XCircle, Eye, MapPin } from 'lucide-react';

interface Operator {
  id: string;
  user_id: string;
  company_name: string;
  company_name_en: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  city: string | null;
  country: string | null;
  is_verified: boolean;
  is_active: boolean;
  admin_notes: string | null;
  created_at: string;
}

interface PendingProgram {
  id: string;
  title: string;
  destination: string;
  price: number;
  duration_days: number;
  status: string;
  created_at: string;
  tour_operators: { company_name: string } | null;
}

export default function TourOperatorsManagement() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [programs, setPrograms] = useState<PendingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; programId: string | null }>({ open: false, programId: null });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [opsRes, progsRes] = await Promise.all([
      supabase.from('tour_operators').select('*').order('created_at', { ascending: false }),
      supabase.from('tour_programs')
        .select('id, title, destination, price, duration_days, status, created_at, tour_operators:operator_id(company_name)')
        .in('status', ['pending', 'draft'])
        .order('created_at', { ascending: false }),
    ]);

    if (!opsRes.error) setOperators(opsRes.data || []);
    if (!progsRes.error) setPrograms((progsRes.data as any) || []);
    setLoading(false);
  };

  const toggleVerification = async (op: Operator) => {
    const { error } = await supabase.from('tour_operators').update({
      is_verified: !op.is_verified,
      verified_at: !op.is_verified ? new Date().toISOString() : null,
    }).eq('id', op.id);

    if (error) {
      toast.error('حدث خطأ');
    } else {
      setOperators(operators.map(o => o.id === op.id ? { ...o, is_verified: !o.is_verified } : o));
      toast.success(op.is_verified ? 'تم إلغاء التوثيق' : 'تم توثيق الشركة');
    }
  };

  const toggleActive = async (op: Operator) => {
    const { error } = await supabase.from('tour_operators').update({ is_active: !op.is_active }).eq('id', op.id);
    if (!error) {
      setOperators(operators.map(o => o.id === op.id ? { ...o, is_active: !o.is_active } : o));
      toast.success(op.is_active ? 'تم تعطيل الشركة' : 'تم تفعيل الشركة');
    }
  };

  const approveProgram = async (programId: string) => {
    const { error } = await supabase.from('tour_programs').update({ status: 'approved' }).eq('id', programId);
    if (!error) {
      setPrograms(programs.filter(p => p.id !== programId));
      toast.success('تم اعتماد البرنامج');
    }
  };

  const rejectProgram = async () => {
    if (!rejectDialog.programId) return;
    const { error } = await supabase.from('tour_programs').update({
      status: 'rejected',
      rejection_reason: rejectReason || null,
    }).eq('id', rejectDialog.programId);

    if (!error) {
      setPrograms(programs.filter(p => p.id !== rejectDialog.programId));
      setRejectDialog({ open: false, programId: null });
      setRejectReason('');
      toast.success('تم رفض البرنامج');
    }
  };

  const filteredOperators = operators.filter(o => 
    !search || o.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (o.email && o.email.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">إدارة الشركاء السياحيين</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الشركاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operators.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">شركاء موثقين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operators.filter(o => o.is_verified).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">برامج بانتظار الموافقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{programs.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="operators">
        <TabsList>
          <TabsTrigger value="operators">الشركاء ({operators.length})</TabsTrigger>
          <TabsTrigger value="pending">برامج معلقة ({programs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="operators" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن شركة..." className="pr-10" />
          </div>

          <div className="grid gap-4">
            {filteredOperators.map((op) => (
              <Card key={op.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{op.company_name}</h3>
                          {op.is_verified && <Badge variant="default" className="text-xs">✓ موثق</Badge>}
                          {!op.is_active && <Badge variant="destructive" className="text-xs">معطل</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {op.email || 'لا يوجد بريد'} • {op.city || 'غير محدد'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          انضم: {format(new Date(op.created_at), 'PPP', { locale: ar })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={op.is_verified ? 'outline' : 'default'}
                        onClick={() => toggleVerification(op)}
                      >
                        {op.is_verified ? <XCircle className="h-4 w-4 ml-1" /> : <CheckCircle className="h-4 w-4 ml-1" />}
                        {op.is_verified ? 'إلغاء التوثيق' : 'توثيق'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toggleActive(op)}>
                        {op.is_active ? 'تعطيل' : 'تفعيل'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {programs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">لا توجد برامج بانتظار الموافقة</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {programs.map((prog) => (
                <Card key={prog.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{prog.title}</h3>
                          <Badge variant="outline">{prog.status === 'pending' ? 'بانتظار الموافقة' : 'مسودة'}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 inline ml-1" />
                          {prog.destination} • {prog.duration_days} أيام • {prog.price.toLocaleString()} ر.س
                        </p>
                        <p className="text-xs text-muted-foreground">
                          الشركة: {prog.tour_operators?.company_name || 'غير معروف'} • {format(new Date(prog.created_at), 'PPP', { locale: ar })}
                        </p>
                      </div>
                      {prog.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => approveProgram(prog.id)}>
                            <CheckCircle className="h-4 w-4 ml-1" />
                            اعتماد
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setRejectDialog({ open: true, programId: prog.id })}>
                            <XCircle className="h-4 w-4 ml-1" />
                            رفض
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, programId: open ? rejectDialog.programId : null })}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>سبب الرفض</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="اكتب سبب رفض البرنامج (اختياري)..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, programId: null })}>إلغاء</Button>
            <Button variant="destructive" onClick={rejectProgram}>تأكيد الرفض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
