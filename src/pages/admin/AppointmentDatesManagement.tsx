import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CalendarClock, Save, Search, Globe } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface CountryAppointment {
  id: string;
  name: string;
  code: string;
  flag_url: string | null;
  is_active: boolean;
  expected_appointment_date: string | null;
  expected_appointment_note: string | null;
  expected_appointment_updated_at: string | null;
}

export default function AppointmentDatesManagement() {
  const { user } = useAuth();
  const { hasPermission, isSuperAdmin, loading: permLoading } = usePermissions();
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';

  const [countries, setCountries] = useState<CountryAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editData, setEditData] = useState<Record<string, { date: string; note: string }>>({});

  const canAccess = isSuperAdmin || hasPermission('manage_appointments' as any);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('countries')
      .select('id, name, code, flag_url, is_active, expected_appointment_date, expected_appointment_note, expected_appointment_updated_at')
      .eq('is_active', true)
      .order('name');

    if (error) {
      toast.error('خطأ في جلب البيانات');
    } else {
      setCountries(data || []);
      const initial: Record<string, { date: string; note: string }> = {};
      (data || []).forEach((c) => {
        initial[c.id] = {
          date: c.expected_appointment_date || '',
          note: c.expected_appointment_note || '',
        };
      });
      setEditData(initial);
    }
    setLoading(false);
  };

  const handleSave = async (country: CountryAppointment) => {
    const d = editData[country.id];
    if (!d) return;

    setSavingId(country.id);
    const { error } = await supabase
      .from('countries')
      .update({
        expected_appointment_date: d.date || null,
        expected_appointment_note: d.note || null,
        expected_appointment_updated_at: new Date().toISOString(),
        expected_appointment_updated_by: user?.id || null,
      })
      .eq('id', country.id);

    if (error) {
      toast.error('خطأ في حفظ البيانات');
    } else {
      toast.success(`تم تحديث موعد ${country.name} بنجاح`);
      fetchCountries();
    }
    setSavingId(null);
  };

  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
  );

  if (permLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canAccess) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <CalendarClock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">مواعيد السفارات المتوقعة</h2>
            <p className="text-sm text-muted-foreground">تحديث التواريخ المتوقعة لمواعيد السفارات لكل دولة</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1.5 self-start">
          <Globe className="h-3.5 w-3.5" />
          {filtered.length} دولة
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ابحث عن دولة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">لا توجد دول مطابقة</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((country) => {
            const d = editData[country.id] || { date: '', note: '' };
            const hasChanged =
              d.date !== (country.expected_appointment_date || '') ||
              d.note !== (country.expected_appointment_note || '');

            return (
              <Card key={country.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {country.flag_url && (
                      <img src={country.flag_url} alt="" className="h-5 w-7 rounded object-cover" />
                    )}
                    {country.name}
                    <span className="text-xs text-muted-foreground">({country.code})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">الموعد المتوقع للسفارة</Label>
                    <Input
                      value={d.date}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          [country.id]: { ...prev[country.id], date: e.target.value },
                        }))
                      }
                      placeholder="مثال: خلال 2-3 أسابيع"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">ملاحظة إضافية (اختياري)</Label>
                    <Input
                      value={d.note}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          [country.id]: { ...prev[country.id], note: e.target.value },
                        }))
                      }
                      placeholder="مثال: المواعيد قد تتغير حسب الموسم"
                      className="mt-1"
                    />
                  </div>
                  {country.expected_appointment_updated_at && (
                    <p className="text-[11px] text-muted-foreground">
                      آخر تحديث: {new Date(country.expected_appointment_updated_at).toLocaleDateString('ar-SA')}
                    </p>
                  )}
                  <Button
                    size="sm"
                    className="w-full gap-2"
                    disabled={!hasChanged || savingId === country.id}
                    onClick={() => handleSave(country)}
                  >
                    {savingId === country.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    حفظ
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
