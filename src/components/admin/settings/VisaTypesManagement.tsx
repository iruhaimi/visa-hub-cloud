import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  FileText, 
  Search,
  DollarSign,
  Clock,
  Calendar,
  Eye,
  EyeOff,
  Filter,
  ChevronDown,
  CheckCircle2,
  List
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SARSymbol from '@/components/ui/SARSymbol';
import type { Country } from './CountriesManagement';

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

interface VisaTypesManagementProps {
  visaTypes: VisaType[];
  countries: Country[];
  isLoading: boolean;
  isRTL: boolean;
}

export function VisaTypesManagement({ visaTypes, countries, isLoading, isRTL }: VisaTypesManagementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingVisa, setEditingVisa] = useState<VisaType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [visaToDelete, setVisaToDelete] = useState<VisaType | null>(null);
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
      setDeleteDialogOpen(false);
      setVisaToDelete(null);
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
      toast.success('تم تحديث الحالة');
    },
  });

  // فلترة أنواع التأشيرات
  const filteredVisaTypes = visaTypes.filter(visa => {
    const matchesSearch = searchQuery 
      ? visa.name.includes(searchQuery) || visa.country?.name?.includes(searchQuery)
      : true;
    const matchesCountry = filterCountry !== 'all' 
      ? visa.country_id === filterCountry
      : true;
    return matchesSearch && matchesCountry;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-l from-primary/5 to-transparent border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">إدارة أنواع التأشيرات</CardTitle>
                <CardDescription>
                  {visaTypes.length} نوع تأشيرة • {visaTypes.filter(v => v.is_active).length} نشطة
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={() => setIsOpen(true)} 
              className="gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              إضافة نوع تأشيرة
            </Button>
          </div>

          {/* شريط البحث والفلترة */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن نوع تأشيرة..."
                className="pr-10 bg-background"
              />
            </div>
            <Select value={filterCountry} onValueChange={setFilterCountry}>
              <SelectTrigger className="w-full sm:w-48 bg-background">
                <Filter className="h-4 w-4 ml-2 text-muted-foreground" />
                <SelectValue placeholder="كل الدول" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الدول</SelectItem>
                {countries.map(country => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className={cn("font-semibold", isRTL && "text-right")}>
                    التأشيرة
                  </TableHead>
                  <TableHead className={cn("font-semibold", isRTL && "text-right")}>
                    الدولة
                  </TableHead>
                  <TableHead className={cn("font-semibold", isRTL && "text-right")}>
                    السعر
                  </TableHead>
                  <TableHead className={cn("font-semibold text-center", isRTL && "text-right")}>
                    المدة
                  </TableHead>
                  <TableHead className={cn("font-semibold text-center", isRTL && "text-right")}>
                    الحالة
                  </TableHead>
                  <TableHead className={cn("font-semibold text-center", isRTL && "text-right")}>
                    الإجراءات
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisaTypes.map((visa) => (
                  <TableRow key={visa.id} className="group">
                    <TableCell>
                      <div>
                        <p className="font-medium">{visa.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={visa.entry_type === 'multiple' ? 'default' : 'secondary'} className="text-xs">
                            {visa.entry_type === 'single' ? 'دخول واحد' : 'دخول متعدد'}
                          </Badge>
                          {visa.validity_days && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              صلاحية {visa.validity_days} يوم
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {visa.country?.flag_url && (
                          <img 
                            src={visa.country.flag_url} 
                            alt="" 
                            className="h-4 w-6 rounded border"
                          />
                        )}
                        <span>{visa.country?.name || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-semibold text-primary">
                        <SARSymbol className="h-3 w-3" />
                        <span>{visa.price.toLocaleString()}</span>
                      </div>
                      {visa.government_fees && visa.government_fees > 0 && (
                        <p className="text-xs text-muted-foreground">
                          + رسوم حكومية {visa.government_fees}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{visa.processing_days} أيام</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={visa.is_active}
                          onCheckedChange={(checked) => 
                            toggleActiveMutation.mutate({ id: visa.id, is_active: checked })
                          }
                        />
                        <span className="text-xs">
                          {visa.is_active ? (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                            </span>
                          ) : (
                            <span className="text-amber-600 flex items-center gap-1">
                              <EyeOff className="h-3 w-3" />
                            </span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(visa)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>تعديل</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                setVisaToDelete(visa);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>حذف</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredVisaTypes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <FileText className="h-10 w-10 opacity-50" />
                        <p>{searchQuery || filterCountry !== 'all' ? 'لا توجد نتائج' : 'لا توجد أنواع تأشيرات'}</p>
                        {!searchQuery && filterCountry === 'all' && (
                          <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
                            <Plus className="h-4 w-4 ml-1" />
                            أضف أول نوع تأشيرة
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog إضافة/تعديل نوع تأشيرة */}
      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
        <DialogContent className={cn("sm:max-w-2xl max-h-[90vh] overflow-y-auto", isRTL && "text-right")}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {editingVisa ? 'تعديل نوع التأشيرة' : 'إضافة نوع تأشيرة جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingVisa ? 'قم بتعديل بيانات التأشيرة' : 'أدخل تفاصيل نوع التأشيرة الجديد'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Accordion type="multiple" defaultValue={['basic', 'pricing']} className="space-y-4">
              {/* المعلومات الأساسية */}
              <AccordionItem value="basic" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-semibold">المعلومات الأساسية</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الدولة <span className="text-destructive">*</span></Label>
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
                              <div className="flex items-center gap-2">
                                {country.flag_url && (
                                  <img src={country.flag_url} alt="" className="h-4 w-6 rounded" />
                                )}
                                {country.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>اسم التأشيرة <span className="text-destructive">*</span></Label>
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
                      <Label>نوع التأشيرة نشط</Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* الأسعار */}
              <AccordionItem value="pricing" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold">الأسعار (ريال سعودي)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>سعر البالغ (12+ سنة) <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="500"
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          ر.س
                        </span>
                      </div>
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
                        {formData.child_price ? '' : `افتراضي: ${formData.price ? Math.round(parseFloat(formData.price) * 0.75) : 0} ريال`}
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
                        {formData.infant_price ? '' : `افتراضي: ${formData.price ? Math.round(parseFloat(formData.price) * 0.5) : 0} ريال`}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 space-y-3">
                    <Label className="font-semibold text-amber-800 dark:text-amber-200">الرسوم الحكومية</Label>
                    <Input
                      type="number"
                      value={formData.government_fees}
                      onChange={(e) => setFormData({ ...formData, government_fees: e.target.value })}
                      placeholder="0 إذا كانت شاملة في السعر"
                    />
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
                </AccordionContent>
              </AccordionItem>

              {/* المدة والصلاحية */}
              <AccordionItem value="duration" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">المدة والصلاحية</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>مدة المعالجة (أيام عمل) <span className="text-destructive">*</span></Label>
                      <Input
                        type="number"
                        value={formData.processing_days}
                        onChange={(e) => setFormData({ ...formData, processing_days: e.target.value })}
                        placeholder="7"
                      />
                    </div>
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
                </AccordionContent>
              </AccordionItem>

              {/* المتطلبات */}
              <AccordionItem value="requirements" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4 text-purple-600" />
                    <span className="font-semibold">المتطلبات</span>
                    {formData.requirements && (
                      <Badge variant="secondary" className="mr-2">
                        {formData.requirements.split('\n').filter(r => r.trim()).length} متطلب
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>المتطلبات (سطر لكل متطلب)</Label>
                    <Textarea
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      placeholder="جواز سفر ساري المفعول لمدة 6 أشهر على الأقل&#10;صورة شخصية بخلفية بيضاء&#10;حجز فندقي مؤكد&#10;تذكرة طيران ذهاب وعودة"
                      rows={5}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      أدخل كل متطلب في سطر منفصل
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Button 
              className="w-full mt-6" 
              size="lg"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !formData.name || !formData.country_id || !formData.price}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                  {editingVisa ? 'حفظ التغييرات' : 'إضافة نوع التأشيرة'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* تأكيد الحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف نوع التأشيرة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف "{visaToDelete?.name}"؟
              <br />
              <span className="text-destructive font-medium">
                لا يمكن التراجع عن هذا الإجراء.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => visaToDelete && deleteMutation.mutate(visaToDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'حذف'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
