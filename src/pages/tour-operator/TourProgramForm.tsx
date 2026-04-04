import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Save, Send, ArrowRight } from 'lucide-react';

export default function TourProgramForm() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [operatorId, setOperatorId] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [form, setForm] = useState({
    title: '',
    title_en: '',
    description: '',
    description_en: '',
    destination: '',
    destination_en: '',
    cover_image_url: '',
    duration_days: 1,
    duration_nights: 0,
    price: 0,
    discounted_price: null as number | null,
    discount_percentage: null as number | null,
    max_seats: null as number | null,
    start_date: '',
    end_date: '',
    cancellation_policy: '',
    inclusions_text: '',
    exclusions_text: '',
    daily_itinerary_text: '',
    hotels_text: '',
  });

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      const { data: op } = await supabase
        .from('tour_operators')
        .select('id, is_verified')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!op) {
        navigate('/tour-operator/setup');
        return;
      }

      setOperatorId(op.id);
      setIsVerified(op.is_verified);

      if (isEditing) {
        const { data: program } = await supabase
          .from('tour_programs')
          .select('*')
          .eq('id', id)
          .eq('operator_id', op.id)
          .maybeSingle();

        if (program) {
          setForm({
            title: program.title || '',
            title_en: program.title_en || '',
            description: program.description || '',
            description_en: program.description_en || '',
            destination: program.destination || '',
            destination_en: program.destination_en || '',
            cover_image_url: program.cover_image_url || '',
            duration_days: program.duration_days || 1,
            duration_nights: program.duration_nights || 0,
            price: program.price || 0,
            discounted_price: program.discounted_price,
            discount_percentage: program.discount_percentage,
            max_seats: program.max_seats,
            start_date: program.start_date || '',
            end_date: program.end_date || '',
            cancellation_policy: program.cancellation_policy || '',
            inclusions_text: Array.isArray(program.inclusions) ? (program.inclusions as string[]).join('\n') : '',
            exclusions_text: Array.isArray(program.exclusions) ? (program.exclusions as string[]).join('\n') : '',
            daily_itinerary_text: Array.isArray(program.daily_itinerary) ? (program.daily_itinerary as string[]).join('\n') : '',
            hotels_text: Array.isArray(program.hotels) ? (program.hotels as string[]).join('\n') : '',
          });
        }
      }
    };

    init();
  }, [user, id, isEditing, navigate]);

  const buildPayload = (status: string) => ({
    operator_id: operatorId!,
    title: form.title,
    title_en: form.title_en || null,
    description: form.description || null,
    description_en: form.description_en || null,
    destination: form.destination,
    destination_en: form.destination_en || null,
    cover_image_url: form.cover_image_url || null,
    duration_days: form.duration_days,
    duration_nights: form.duration_nights,
    price: form.price,
    discounted_price: form.discounted_price,
    discount_percentage: form.discount_percentage,
    max_seats: form.max_seats,
    start_date: form.start_date || null,
    end_date: form.end_date || null,
    cancellation_policy: form.cancellation_policy || null,
    inclusions: form.inclusions_text ? form.inclusions_text.split('\n').filter(Boolean) : [],
    exclusions: form.exclusions_text ? form.exclusions_text.split('\n').filter(Boolean) : [],
    daily_itinerary: form.daily_itinerary_text ? form.daily_itinerary_text.split('\n').filter(Boolean) : [],
    hotels: form.hotels_text ? form.hotels_text.split('\n').filter(Boolean) : [],
    status,
  });

  const handleSave = async (publish: boolean) => {
    if (!form.title.trim() || !form.destination.trim()) {
      toast.error('يرجى إدخال عنوان البرنامج والوجهة');
      return;
    }

    setLoading(true);
    try {
      const status = publish
        ? (isVerified ? 'approved' : 'pending')
        : 'draft';
      
      const payload = buildPayload(status);

      if (isEditing) {
        const { error } = await supabase.from('tour_programs').update(payload).eq('id', id);
        if (error) throw error;
        toast.success(publish ? 'تم نشر البرنامج' : 'تم حفظ التعديلات');
      } else {
        const { error } = await supabase.from('tour_programs').insert(payload);
        if (error) throw error;
        toast.success(publish ? 'تم إرسال البرنامج للنشر' : 'تم حفظ المسودة');
      }

      navigate('/tour-operator/programs');
    } catch (error: any) {
      console.error('Error saving program:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => setForm({ ...form, [field]: value });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tour-operator/programs')}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{isEditing ? 'تعديل البرنامج' : 'إضافة برنامج جديد'}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader><CardTitle>المعلومات الأساسية</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>عنوان البرنامج (عربي) *</Label>
                  <Input value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="رحلة إسطنبول الساحرة" />
                </div>
                <div className="space-y-2">
                  <Label>عنوان البرنامج (إنجليزي)</Label>
                  <Input value={form.title_en} onChange={(e) => updateField('title_en', e.target.value)} placeholder="Enchanting Istanbul Trip" dir="ltr" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>الوجهة (عربي) *</Label>
                  <Input value={form.destination} onChange={(e) => updateField('destination', e.target.value)} placeholder="إسطنبول، تركيا" />
                </div>
                <div className="space-y-2">
                  <Label>الوجهة (إنجليزي)</Label>
                  <Input value={form.destination_en} onChange={(e) => updateField('destination_en', e.target.value)} placeholder="Istanbul, Turkey" dir="ltr" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>وصف البرنامج</Label>
                <Textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={4} placeholder="وصف تفصيلي عن البرنامج..." />
              </div>
              <div className="space-y-2">
                <Label>رابط صورة الغلاف</Label>
                <Input value={form.cover_image_url} onChange={(e) => updateField('cover_image_url', e.target.value)} placeholder="https://..." dir="ltr" />
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader><CardTitle>تفاصيل البرنامج</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>الجدول اليومي (كل يوم في سطر)</Label>
                <Textarea value={form.daily_itinerary_text} onChange={(e) => updateField('daily_itinerary_text', e.target.value)} rows={5} placeholder="اليوم الأول: الوصول والاستقبال&#10;اليوم الثاني: جولة في المدينة القديمة" />
              </div>
              <div className="space-y-2">
                <Label>الفنادق (كل فندق في سطر)</Label>
                <Textarea value={form.hotels_text} onChange={(e) => updateField('hotels_text', e.target.value)} rows={3} placeholder="فندق هيلتون إسطنبول 5 نجوم" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>يشمل (كل عنصر في سطر)</Label>
                  <Textarea value={form.inclusions_text} onChange={(e) => updateField('inclusions_text', e.target.value)} rows={4} placeholder="الإقامة في فندق 5 نجوم&#10;الإفطار اليومي&#10;المواصلات" />
                </div>
                <div className="space-y-2">
                  <Label>لا يشمل (كل عنصر في سطر)</Label>
                  <Textarea value={form.exclusions_text} onChange={(e) => updateField('exclusions_text', e.target.value)} rows={4} placeholder="تذاكر الطيران&#10;التأشيرة&#10;المصاريف الشخصية" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>سياسة الإلغاء</Label>
                <Textarea value={form.cancellation_policy} onChange={(e) => updateField('cancellation_policy', e.target.value)} rows={2} placeholder="إلغاء مجاني قبل 7 أيام من تاريخ الرحلة" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>المدة والسعر</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>عدد الأيام</Label>
                  <Input type="number" min={1} value={form.duration_days} onChange={(e) => updateField('duration_days', parseInt(e.target.value) || 1)} />
                </div>
                <div className="space-y-2">
                  <Label>عدد الليالي</Label>
                  <Input type="number" min={0} value={form.duration_nights} onChange={(e) => updateField('duration_nights', parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>السعر (ر.س)</Label>
                <Input type="number" min={0} value={form.price} onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>سعر الخصم (ر.س)</Label>
                <Input type="number" min={0} value={form.discounted_price || ''} onChange={(e) => updateField('discounted_price', e.target.value ? parseFloat(e.target.value) : null)} />
              </div>
              <div className="space-y-2">
                <Label>نسبة الخصم %</Label>
                <Input type="number" min={0} max={100} value={form.discount_percentage || ''} onChange={(e) => updateField('discount_percentage', e.target.value ? parseInt(e.target.value) : null)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>التواريخ والمقاعد</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>تاريخ البداية</Label>
                <Input type="date" value={form.start_date} onChange={(e) => updateField('start_date', e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>تاريخ النهاية</Label>
                <Input type="date" value={form.end_date} onChange={(e) => updateField('end_date', e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>عدد المقاعد (اتركه فارغاً = غير محدود)</Label>
                <Input type="number" min={1} value={form.max_seats || ''} onChange={(e) => updateField('max_seats', e.target.value ? parseInt(e.target.value) : null)} />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button onClick={() => handleSave(true)} disabled={loading}>
              <Send className="h-4 w-4 ml-2" />
              {isVerified ? 'نشر البرنامج' : 'إرسال للمراجعة'}
            </Button>
            <Button variant="outline" onClick={() => handleSave(false)} disabled={loading}>
              <Save className="h-4 w-4 ml-2" />
              حفظ كمسودة
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
