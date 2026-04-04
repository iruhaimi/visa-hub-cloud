import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';

export default function TourOperatorSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company_name: '',
    company_name_en: '',
    description: '',
    whatsapp_number: '',
    phone: '',
    email: '',
    website: '',
    city: '',
    country: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!form.company_name.trim()) {
      toast.error('يرجى إدخال اسم الشركة');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('tour_operators').insert({
        user_id: user.id,
        ...form,
      });

      if (error) throw error;

      // Add tour_operator role
      await supabase.from('user_roles').insert({
        user_id: user.id,
        role: 'tour_operator' as any,
      });

      toast.success('تم إنشاء ملف الشركة بنجاح! سيتم مراجعته من الإدارة.');
      navigate('/tour-operator');
    } catch (error: any) {
      console.error('Error creating operator profile:', error);
      toast.error('حدث خطأ أثناء إنشاء الملف');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">إعداد ملف الشركة</CardTitle>
          <CardDescription>أدخل بيانات شركتك السياحية للبدء في نشر البرامج</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>اسم الشركة (عربي) *</Label>
                <Input
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  placeholder="مثال: شركة السفر الذهبي"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>اسم الشركة (إنجليزي)</Label>
                <Input
                  value={form.company_name_en}
                  onChange={(e) => setForm({ ...form, company_name_en: e.target.value })}
                  placeholder="e.g., Golden Travel Company"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>وصف الشركة</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="نبذة عن شركتك وخدماتها..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>رقم الواتساب</Label>
                <Input
                  value={form.whatsapp_number}
                  onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                  placeholder="966500000000"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="966500000000"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="info@company.com"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>الموقع الإلكتروني</Label>
                <Input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://company.com"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>المدينة</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="الرياض"
                />
              </div>
              <div className="space-y-2">
                <Label>الدولة</Label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="المملكة العربية السعودية"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'جاري الإنشاء...' : 'إنشاء ملف الشركة'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
