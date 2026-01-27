import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Globe, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Country {
  id: string;
  name: string;
  code: string;
  flag_url: string | null;
  is_active: boolean;
}

interface VisaType {
  id: string;
  country_id: string;
  name: string;
  description: string | null;
  price: number;
  child_price: number | null;
  infant_price: number | null;
  government_fees: number | null;
  processing_days: number;
  validity_days: number | null;
  max_stay_days: number | null;
  entry_type: string | null;
  is_active: boolean;
  requirements: string[];
  price_notes: string | null;
  price_notes_en: string | null;
  fee_type: string | null;
  country?: Country;
}

export default function Settings() {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const queryClient = useQueryClient();

  // Countries
  const { data: countries, isLoading: loadingCountries } = useQuery({
    queryKey: ['admin-countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Country[];
    },
  });

  // Visa Types
  const { data: visaTypes, isLoading: loadingVisaTypes } = useQuery({
    queryKey: ['admin-visa-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visa_types')
        .select('*, country:countries(*)')
        .order('name');
      if (error) throw error;
      return data as VisaType[];
    },
  });

  return (
    <div className={cn("space-y-6", isRTL && "text-right")}>
      <div>
        <h1 className="text-2xl font-bold">الإعدادات</h1>
        <p className="text-muted-foreground">إدارة الدول وأنواع التأشيرات</p>
      </div>

      <Tabs defaultValue="countries" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="countries" className="gap-2">
            <Globe className="h-4 w-4" />
            الدول
          </TabsTrigger>
          <TabsTrigger value="visa-types" className="gap-2">
            <FileText className="h-4 w-4" />
            أنواع التأشيرات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="countries" className="mt-6">
          <CountriesManagement 
            countries={countries || []} 
            isLoading={loadingCountries}
            isRTL={isRTL}
          />
        </TabsContent>

        <TabsContent value="visa-types" className="mt-6">
          <VisaTypesManagement 
            visaTypes={visaTypes || []} 
            countries={countries || []}
            isLoading={loadingVisaTypes}
            isRTL={isRTL}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Countries Management Component
function CountriesManagement({ 
  countries, 
  isLoading,
  isRTL 
}: { 
  countries: Country[]; 
  isLoading: boolean;
  isRTL: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    flag_url: '',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({ name: '', code: '', flag_url: '', is_active: true });
    setEditingCountry(null);
  };

  const openEdit = (country: Country) => {
    setEditingCountry(country);
    setFormData({
      name: country.name,
      code: country.code,
      flag_url: country.flag_url || '',
      is_active: country.is_active,
    });
    setIsOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingCountry) {
        const { error } = await supabase
          .from('countries')
          .update({
            name: formData.name,
            code: formData.code.toUpperCase(),
            flag_url: formData.flag_url || null,
            is_active: formData.is_active,
          })
          .eq('id', editingCountry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('countries')
          .insert({
            name: formData.name,
            code: formData.code.toUpperCase(),
            flag_url: formData.flag_url || null,
            is_active: formData.is_active,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-countries'] });
      toast.success(editingCountry ? 'تم تحديث الدولة بنجاح' : 'تم إضافة الدولة بنجاح');
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('countries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-countries'] });
      toast.success('تم حذف الدولة بنجاح');
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('countries')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-countries'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>إدارة الدول</CardTitle>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة دولة
            </Button>
          </DialogTrigger>
          <DialogContent className={cn(isRTL && "text-right")}>
            <DialogHeader>
              <DialogTitle>{editingCountry ? 'تعديل الدولة' : 'إضافة دولة جديدة'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>اسم الدولة</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: الإمارات العربية المتحدة"
                />
              </div>
              <div className="space-y-2">
                <Label>رمز الدولة (ISO)</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="مثال: AE"
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label>رابط العلم (اختياري)</Label>
                <Input
                  value={formData.flag_url}
                  onChange={(e) => setFormData({ ...formData, flag_url: e.target.value })}
                  placeholder="https://..."
                  dir="ltr"
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>نشطة</Label>
              </div>
              <Button 
                className="w-full" 
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !formData.name || !formData.code}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  editingCountry ? 'حفظ التغييرات' : 'إضافة'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={isRTL ? "text-right" : ""}>الدولة</TableHead>
              <TableHead className={isRTL ? "text-right" : ""}>الرمز</TableHead>
              <TableHead className={isRTL ? "text-right" : ""}>الحالة</TableHead>
              <TableHead className={isRTL ? "text-right" : ""}>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {countries.map((country) => (
              <TableRow key={country.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {country.flag_url && (
                      <img src={country.flag_url} alt="" className="h-5 w-7 object-cover rounded" />
                    )}
                    {country.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{country.code}</Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={country.is_active}
                    onCheckedChange={(checked) => 
                      toggleActiveMutation.mutate({ id: country.id, is_active: checked })
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(country)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive"
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذه الدولة؟')) {
                          deleteMutation.mutate(country.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {countries.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  لا توجد دول مضافة
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Visa Types Management Component
function VisaTypesManagement({ 
  visaTypes, 
  countries,
  isLoading,
  isRTL 
}: { 
  visaTypes: VisaType[]; 
  countries: Country[];
  isLoading: boolean;
  isRTL: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingVisa, setEditingVisa] = useState<VisaType | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    country_id: '',
    name: '',
    description: '',
    price: '',
    child_price: '',
    infant_price: '',
    government_fees: '',
    processing_days: '7',
    validity_days: '',
    max_stay_days: '',
    entry_type: 'single',
    is_active: true,
    requirements: '',
    price_notes: 'شامل رسوم التأشيرة',
    price_notes_en: 'Visa fees included',
    fee_type: 'included',
  });

  const resetForm = () => {
    setFormData({
      country_id: '',
      name: '',
      description: '',
      price: '',
      child_price: '',
      infant_price: '',
      government_fees: '',
      processing_days: '7',
      validity_days: '',
      max_stay_days: '',
      entry_type: 'single',
      is_active: true,
      requirements: '',
      price_notes: 'شامل رسوم التأشيرة',
      price_notes_en: 'Visa fees included',
      fee_type: 'included',
    });
    setEditingVisa(null);
  };

  const openEdit = (visa: VisaType) => {
    setEditingVisa(visa);
    setFormData({
      country_id: visa.country_id,
      name: visa.name,
      description: visa.description || '',
      price: visa.price.toString(),
      child_price: visa.child_price?.toString() || '',
      infant_price: visa.infant_price?.toString() || '',
      government_fees: visa.government_fees?.toString() || '',
      processing_days: visa.processing_days.toString(),
      validity_days: visa.validity_days?.toString() || '',
      max_stay_days: visa.max_stay_days?.toString() || '',
      entry_type: visa.entry_type || 'single',
      is_active: visa.is_active,
      requirements: Array.isArray(visa.requirements) ? visa.requirements.join('\n') : '',
      price_notes: visa.price_notes || 'شامل رسوم التأشيرة',
      price_notes_en: visa.price_notes_en || 'Visa fees included',
      fee_type: visa.fee_type || 'included',
    });
    setIsOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const requirementsArray = formData.requirements
        .split('\n')
        .map(r => r.trim())
        .filter(r => r.length > 0);

      const payload = {
        country_id: formData.country_id,
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        child_price: formData.child_price ? parseFloat(formData.child_price) : null,
        infant_price: formData.infant_price ? parseFloat(formData.infant_price) : null,
        government_fees: formData.government_fees ? parseFloat(formData.government_fees) : 0,
        processing_days: parseInt(formData.processing_days),
        validity_days: formData.validity_days ? parseInt(formData.validity_days) : null,
        max_stay_days: formData.max_stay_days ? parseInt(formData.max_stay_days) : null,
        entry_type: formData.entry_type,
        is_active: formData.is_active,
        requirements: requirementsArray,
        price_notes: formData.price_notes || null,
        price_notes_en: formData.price_notes_en || null,
        fee_type: formData.fee_type,
      };

      if (editingVisa) {
        const { error } = await supabase
          .from('visa_types')
          .update(payload)
          .eq('id', editingVisa.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('visa_types')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-visa-types'] });
      toast.success(editingVisa ? 'تم تحديث نوع التأشيرة بنجاح' : 'تم إضافة نوع التأشيرة بنجاح');
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('visa_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-visa-types'] });
      toast.success('تم حذف نوع التأشيرة بنجاح');
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('visa_types')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-visa-types'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>إدارة أنواع التأشيرات</CardTitle>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة نوع تأشيرة
            </Button>
          </DialogTrigger>
          <DialogContent className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", isRTL && "text-right")}>
            <DialogHeader>
              <DialogTitle>{editingVisa ? 'تعديل نوع التأشيرة' : 'إضافة نوع تأشيرة جديد'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الدولة</Label>
                  <Select
                    value={formData.country_id}
                    onValueChange={(value) => setFormData({ ...formData, country_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الدولة" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>اسم التأشيرة</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: تأشيرة سياحية"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مختصر للتأشيرة..."
                  rows={2}
                />
              </div>

              {/* Pricing Section */}
              <div className="p-4 bg-primary/5 rounded-lg space-y-4">
                <Label className="text-base font-semibold">الأسعار (ريال سعودي)</Label>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>سعر البالغ (12+ سنة)</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>سعر الطفل (6-12 سنة)</Label>
                    <Input
                      type="number"
                      value={formData.child_price}
                      onChange={(e) => setFormData({ ...formData, child_price: e.target.value })}
                      placeholder="اتركه فارغاً لـ 75%"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.child_price ? '' : `افتراضي: ${formData.price ? Math.round(parseFloat(formData.price) * 0.75) : 0} ريال (75%)`}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>سعر الرضيع ({'<'}6 سنوات)</Label>
                    <Input
                      type="number"
                      value={formData.infant_price}
                      onChange={(e) => setFormData({ ...formData, infant_price: e.target.value })}
                      placeholder="اتركه فارغاً لـ 50%"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.infant_price ? '' : `افتراضي: ${formData.price ? Math.round(parseFloat(formData.price) * 0.5) : 0} ريال (50%)`}
                    </p>
                  </div>
                </div>

                {/* Government Fees */}
                <div className="space-y-2">
                  <Label>رسوم التأشيرة الحكومية (ريال سعودي)</Label>
                  <Input
                    type="number"
                    value={formData.government_fees}
                    onChange={(e) => setFormData({ ...formData, government_fees: e.target.value })}
                    placeholder="0 إذا كانت شاملة في السعر"
                  />
                  <p className="text-xs text-muted-foreground">
                    أدخل قيمة رسوم التأشيرة الحكومية (تظهر في جدول الأسعار)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>مدة المعالجة (أيام)</Label>
                  <Input
                    type="number"
                    value={formData.processing_days}
                    onChange={(e) => setFormData({ ...formData, processing_days: e.target.value })}
                    placeholder="7"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>صلاحية التأشيرة (أيام)</Label>
                  <Input
                    type="number"
                    value={formData.validity_days}
                    onChange={(e) => setFormData({ ...formData, validity_days: e.target.value })}
                    placeholder="90"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحد الأقصى للإقامة (أيام)</Label>
                  <Input
                    type="number"
                    value={formData.max_stay_days}
                    onChange={(e) => setFormData({ ...formData, max_stay_days: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع الدخول</Label>
                  <Select
                    value={formData.entry_type}
                    onValueChange={(value) => setFormData({ ...formData, entry_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">دخول واحد</SelectItem>
                      <SelectItem value="multiple">دخول متعدد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-3 pb-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>نشطة</Label>
                </div>
              </div>

              {/* Price Notes Section */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                <Label className="text-base font-semibold">ملاحظات الأسعار</Label>
                
                <div className="space-y-2">
                  <Label>نوع الرسوم</Label>
                  <Select
                    value={formData.fee_type}
                    onValueChange={(value) => setFormData({ ...formData, fee_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="included">شامل رسوم التأشيرة الحكومية</SelectItem>
                      <SelectItem value="separate">رسوم التأشيرة تُدفع بشكل منفصل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ملاحظة السعر (عربي)</Label>
                    <Input
                      value={formData.price_notes}
                      onChange={(e) => setFormData({ ...formData, price_notes: e.target.value })}
                      placeholder="شامل رسوم التأشيرة"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ملاحظة السعر (إنجليزي)</Label>
                    <Input
                      value={formData.price_notes_en}
                      onChange={(e) => setFormData({ ...formData, price_notes_en: e.target.value })}
                      placeholder="Visa fees included"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>المتطلبات (سطر لكل متطلب)</Label>
                <Textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="جواز سفر ساري المفعول&#10;صورة شخصية&#10;حجز فندقي..."
                  rows={4}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !formData.name || !formData.country_id || !formData.price}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  editingVisa ? 'حفظ التغييرات' : 'إضافة'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={isRTL ? "text-right" : ""}>التأشيرة</TableHead>
              <TableHead className={isRTL ? "text-right" : ""}>الدولة</TableHead>
              <TableHead className={isRTL ? "text-right" : ""}>السعر</TableHead>
              <TableHead className={isRTL ? "text-right" : ""}>المدة</TableHead>
              <TableHead className={isRTL ? "text-right" : ""}>الحالة</TableHead>
              <TableHead className={isRTL ? "text-right" : ""}>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visaTypes.map((visa) => (
              <TableRow key={visa.id}>
                <TableCell className="font-medium">
                  <div>
                    <p>{visa.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {visa.entry_type === 'single' ? 'دخول واحد' : 'دخول متعدد'}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{visa.country?.name || '-'}</TableCell>
                <TableCell>{visa.price} ريال</TableCell>
                <TableCell>{visa.processing_days} أيام</TableCell>
                <TableCell>
                  <Switch
                    checked={visa.is_active}
                    onCheckedChange={(checked) => 
                      toggleActiveMutation.mutate({ id: visa.id, is_active: checked })
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(visa)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive"
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف نوع التأشيرة هذا؟')) {
                          deleteMutation.mutate(visa.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {visaTypes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  لا توجد أنواع تأشيرات مضافة
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
