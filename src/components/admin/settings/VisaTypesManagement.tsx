import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
  TooltipProvider,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  ChevronRight,
  CheckCircle2,
  List,
  Copy,
  XCircle,
  Globe,
  TrendingUp,
  Layers,
  Save,
  GripVertical,
  ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SARSymbol from '@/components/ui/SARSymbol';
import type { Country } from './CountriesManagement';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  display_order?: number;
}

interface VisaTypesManagementProps {
  visaTypes: VisaType[];
  countries: Country[];
  isLoading: boolean;
  isRTL: boolean;
}

// Sortable Visa Row Component
function SortableVisaRow({
  visa,
  isReorderMode,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleActive,
  onInlineEditStart,
  inlineEditingId,
  inlinePrice,
  setInlinePrice,
  onInlineSave,
  onInlineCancel,
  updatePricePending,
}: {
  visa: VisaType;
  isReorderMode: boolean;
  onEdit: (visa: VisaType) => void;
  onDelete: (visa: VisaType) => void;
  onDuplicate: (visa: VisaType) => void;
  onToggleActive: (id: string, is_active: boolean) => void;
  onInlineEditStart: (visa: VisaType) => void;
  inlineEditingId: string | null;
  inlinePrice: string;
  setInlinePrice: (value: string) => void;
  onInlineSave: (id: string) => void;
  onInlineCancel: () => void;
  updatePricePending: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: visa.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 flex items-center justify-between gap-4 group transition-colors border-b last:border-b-0",
        isDragging && "bg-primary/5 shadow-lg z-50",
        !visa.is_active && "bg-muted/30"
      )}
    >
      {isReorderMode && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded flex-shrink-0"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className={cn("font-medium", !visa.is_active && "text-muted-foreground")}>
            {visa.name}
          </h4>
          <Badge variant={visa.entry_type === 'multiple' ? 'default' : 'secondary'} className="text-xs">
            {visa.entry_type === 'single' ? 'دخول واحد' : 'دخول متعدد'}
          </Badge>
          {!visa.is_active && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              <EyeOff className="h-3 w-3 ml-1" />
              غير نشط
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {visa.processing_days} أيام
          </span>
          {visa.validity_days && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              صلاحية {visa.validity_days} يوم
            </span>
          )}
        </div>
      </div>

      {/* السعر */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {inlineEditingId === visa.id ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={inlinePrice}
              onChange={(e) => setInlinePrice(e.target.value)}
              className="w-24 h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onInlineSave(visa.id);
                if (e.key === 'Escape') onInlineCancel();
              }}
            />
            <Button 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onInlineSave(visa.id)}
              disabled={updatePricePending}
            >
              {updatePricePending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onInlineCancel}>
              <XCircle className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => !isReorderMode && onInlineEditStart(visa)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary/5 transition-colors",
                  !isReorderMode && "hover:bg-primary/10 cursor-pointer"
                )}
                disabled={isReorderMode}
              >
                <SARSymbol className="h-3.5 w-3.5 text-primary" />
                <span className="font-bold text-primary text-lg">{visa.price.toLocaleString()}</span>
                {!isReorderMode && (
                  <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mr-1" />
                )}
              </button>
            </TooltipTrigger>
            {!isReorderMode && <TooltipContent>انقر للتعديل السريع</TooltipContent>}
          </Tooltip>
        )}
      </div>

      {/* الإجراءات */}
      {!isReorderMode && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={visa.is_active ? "ghost" : "outline"}
                size="icon"
                className={cn(
                  "h-8 w-8",
                  visa.is_active 
                    ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" 
                    : "text-gray-500 hover:text-gray-600 hover:bg-gray-50"
                )}
                onClick={() => onToggleActive(visa.id, !visa.is_active)}
              >
                {visa.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{visa.is_active ? 'إلغاء التفعيل' : 'تفعيل'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600" onClick={() => onDuplicate(visa)}>
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>نسخ لإنشاء جديد</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-amber-50 hover:text-amber-600" onClick={() => onEdit(visa)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>تعديل كامل</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={() => onDelete(visa)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>حذف</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

// Sortable Country Group Component for reordering countries
function SortableCountryGroup({
  country,
  visaCount,
  activeCount,
}: {
  country: Country;
  visaCount: number;
  activeCount: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: country.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-lg overflow-hidden",
        isDragging && "bg-primary/5 shadow-lg z-50"
      )}
    >
      <div className="flex items-center justify-between p-4 bg-background">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded flex-shrink-0"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          {country.flag_url && (
            <img src={country.flag_url} alt="" className="h-6 w-9 rounded shadow-sm" />
          )}
          <div>
            <h3 className="font-semibold text-lg">{country.name}</h3>
            <p className="text-sm text-muted-foreground">
              {visaCount} نوع تأشيرة • {activeCount} نشطة
            </p>
          </div>
        </div>
        <Badge variant={activeCount === visaCount ? "default" : "secondary"} className="gap-1">
          {activeCount === visaCount ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <span>{activeCount}/{visaCount}</span>
          )}
        </Badge>
      </div>
    </div>
  );
}

export function VisaTypesManagement({ visaTypes, countries, isLoading, isRTL }: VisaTypesManagementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingVisa, setEditingVisa] = useState<VisaType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [visaToDelete, setVisaToDelete] = useState<VisaType | null>(null);
  const [expandedCountries, setExpandedCountries] = useState<string[]>([]);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlinePrice, setInlinePrice] = useState('');
  const [reorderCountryId, setReorderCountryId] = useState<string | null>(null);
  const [reorderedVisas, setReorderedVisas] = useState<VisaType[]>([]);
  const [isCountryReorderMode, setIsCountryReorderMode] = useState(false);
  const [reorderedCountryGroups, setReorderedCountryGroups] = useState<{ country: Country; visas: VisaType[] }[]>([]);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // نسخ تأشيرة لإنشاء جديدة
  const duplicateVisa = (visa: VisaType) => {
    setEditingVisa(null);
    setFormData({
      country_id: visa.country_id,
      name: visa.name + ' (نسخة)',
      description: visa.description || '',
      price: visa.price.toString(),
      child_price: visa.child_price?.toString() || '',
      infant_price: visa.infant_price?.toString() || '',
      government_fees: visa.government_fees?.toString() || '',
      processing_days: visa.processing_days.toString(),
      validity_days: visa.validity_days?.toString() || '',
      max_stay_days: visa.max_stay_days?.toString() || '',
      entry_type: visa.entry_type || 'single',
      is_active: true,
      requirements: Array.isArray(visa.requirements) ? visa.requirements.join('\n') : '',
      price_notes: visa.price_notes || 'شامل رسوم التأشيرة',
      price_notes_en: visa.price_notes_en || 'Visa fees included',
      fee_type: visa.fee_type || 'included',
    });
    setIsOpen(true);
    toast.info('تم نسخ بيانات التأشيرة - قم بتعديل الاسم والحفظ');
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

  const updatePriceMutation = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) => {
      const { error } = await supabase
        .from('visa_types')
        .update({ price })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-visa-types'] });
      toast.success('تم تحديث السعر');
      setInlineEditingId(null);
    },
    onError: (error) => {
      toast.error('خطأ: ' + error.message);
    },
  });

  const reorderVisasMutation = useMutation({
    mutationFn: async (newOrder: { id: string; display_order: number }[]) => {
      for (const item of newOrder) {
        const { error } = await supabase
          .from('visa_types')
          .update({ display_order: item.display_order })
          .eq('id', item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-visa-types'] });
      toast.success('تم حفظ ترتيب التأشيرات');
      setReorderCountryId(null);
      setReorderedVisas([]);
    },
    onError: (error) => {
      toast.error('خطأ: ' + error.message);
    },
  });

  const startReorderVisas = (countryId: string, visas: VisaType[]) => {
    const sorted = [...visas].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    setReorderedVisas(sorted);
    setReorderCountryId(countryId);
  };

  const handleVisaDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setReorderedVisas((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const saveVisaOrder = () => {
    const newOrder = reorderedVisas.map((v, index) => ({
      id: v.id,
      display_order: index + 1,
    }));
    reorderVisasMutation.mutate(newOrder);
  };

  const cancelVisaReorder = () => {
    setReorderCountryId(null);
    setReorderedVisas([]);
  };

  // ترتيب الدول
  const reorderCountriesMutation = useMutation({
    mutationFn: async (newOrder: { id: string; display_order: number }[]) => {
      for (const item of newOrder) {
        const { error } = await supabase
          .from('countries')
          .update({ display_order: item.display_order })
          .eq('id', item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-countries'] });
      toast.success('تم حفظ ترتيب الدول');
      setIsCountryReorderMode(false);
      setReorderedCountryGroups([]);
    },
    onError: (error) => {
      toast.error('خطأ: ' + error.message);
    },
  });

  const startCountryReorder = (groups: { country: Country; visas: VisaType[] }[]) => {
    const sorted = [...groups].sort((a, b) => (a.country.display_order || 0) - (b.country.display_order || 0));
    setReorderedCountryGroups(sorted);
    setIsCountryReorderMode(true);
  };

  const handleCountryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setReorderedCountryGroups((items) => {
        const oldIndex = items.findIndex((i) => i.country.id === active.id);
        const newIndex = items.findIndex((i) => i.country.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const saveCountryOrder = () => {
    const newOrder = reorderedCountryGroups.map((g, index) => ({
      id: g.country.id,
      display_order: index + 1,
    }));
    reorderCountriesMutation.mutate(newOrder);
  };

  const cancelCountryReorder = () => {
    setIsCountryReorderMode(false);
    setReorderedCountryGroups([]);
  };

  // فلترة أنواع التأشيرات
  const filteredVisaTypes = useMemo(() => {
    return visaTypes.filter(visa => {
      const matchesSearch = searchQuery 
        ? visa.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          visa.country?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesCountry = filterCountry !== 'all' 
        ? visa.country_id === filterCountry
        : true;
      const matchesStatus = filterStatus !== 'all'
        ? filterStatus === 'active' ? visa.is_active : !visa.is_active
        : true;
      return matchesSearch && matchesCountry && matchesStatus;
    });
  }, [visaTypes, searchQuery, filterCountry, filterStatus]);

  // تجميع التأشيرات حسب الدولة - مع عرض جميع الدول النشطة حتى بدون تأشيرات
  const groupedByCountry = useMemo(() => {
    const groups: Record<string, { country: Country; visas: VisaType[] }> = {};
    
    // أولاً: إضافة جميع الدول النشطة
    countries.forEach(country => {
      groups[country.id] = { country, visas: [] };
    });
    
    // ثانياً: توزيع التأشيرات على دولها
    filteredVisaTypes.forEach(visa => {
      const countryId = visa.country_id;
      if (groups[countryId]) {
        groups[countryId].visas.push(visa);
      }
    });

    // تصفية حسب فلتر الدولة المختارة
    let result = Object.values(groups);
    
    // ترتيب حسب display_order ثم اسم الدولة
    return result.sort((a, b) => {
      const orderA = a.country.display_order || 999;
      const orderB = b.country.display_order || 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.country.name.localeCompare(b.country.name, 'ar');
    });
  }, [filteredVisaTypes, countries]);

  // إحصائيات
  const stats = useMemo(() => ({
    total: visaTypes.length,
    active: visaTypes.filter(v => v.is_active).length,
    inactive: visaTypes.filter(v => !v.is_active).length,
    countriesWithVisas: countries.length,
  }), [visaTypes, countries]);

  const toggleCountry = (countryId: string) => {
    setExpandedCountries(prev => 
      prev.includes(countryId) 
        ? prev.filter(id => id !== countryId)
        : [...prev, countryId]
    );
  };

  const expandAll = () => {
    setExpandedCountries(groupedByCountry.map(g => g.country.id));
  };

  const collapseAll = () => {
    setExpandedCountries([]);
  };

  const startInlineEdit = (visa: VisaType) => {
    setInlineEditingId(visa.id);
    setInlinePrice(visa.price.toString());
  };

  const saveInlinePrice = (visaId: string) => {
    const price = parseFloat(inlinePrice);
    if (isNaN(price) || price <= 0) {
      toast.error('أدخل سعراً صحيحاً');
      return;
    }
    updatePriceMutation.mutate({ id: visaId, price });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
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
                  {stats.total} نوع تأشيرة في {stats.countriesWithVisas} دولة
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

          {/* بطاقات الإحصائيات */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div 
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all",
                filterStatus === 'all' ? "bg-primary/10 border-primary" : "bg-background hover:bg-muted/50"
              )}
              onClick={() => setFilterStatus('all')}
            >
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">الإجمالي</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div 
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all",
                filterStatus === 'active' ? "bg-emerald-500/10 border-emerald-500" : "bg-background hover:bg-muted/50"
              )}
              onClick={() => setFilterStatus('active')}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-muted-foreground">نشطة</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
            </div>
            <div 
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all",
                filterStatus === 'inactive' ? "bg-gray-500/10 border-gray-500" : "bg-background hover:bg-muted/50"
              )}
              onClick={() => setFilterStatus('inactive')}
            >
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-muted-foreground">غير نشطة</span>
              </div>
              <p className="text-2xl font-bold text-gray-500 mt-1">{stats.inactive}</p>
            </div>
            <div className="p-3 rounded-lg border bg-background">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">الدول</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.countriesWithVisas}</p>
            </div>
          </div>

          {/* شريط البحث والفلترة */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم أو الدولة..."
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
                    <div className="flex items-center gap-2">
                      {country.flag_url && <img src={country.flag_url} alt="" className="h-3 w-5 rounded" />}
                      {country.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll} className="gap-1">
                <ChevronDown className="h-3 w-3" />
                توسيع الكل
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll} className="gap-1">
                <ChevronRight className="h-3 w-3" />
                طي الكل
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {/* زر ترتيب الدول */}
          {groupedByCountry.length > 1 && (
            <div className="flex items-center justify-between p-3 mb-4 bg-muted/30 rounded-lg border">
              {isCountryReorderMode ? (
                <div className="flex items-center gap-2 w-full justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <GripVertical className="h-4 w-4" />
                    اسحب الدول لتغيير ترتيب ظهورها
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={saveCountryOrder}
                      disabled={reorderCountriesMutation.isPending}
                      className="gap-1"
                    >
                      {reorderCountriesMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      حفظ الترتيب
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={cancelCountryReorder}
                      className="gap-1"
                    >
                      <XCircle className="h-3 w-3" />
                      إلغاء
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startCountryReorder(groupedByCountry)}
                  className="gap-2"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  تغيير ترتيب الدول
                </Button>
              )}
            </div>
          )}

          {groupedByCountry.length > 0 ? (
            isCountryReorderMode ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleCountryDragEnd}
              >
                <SortableContext
                  items={reorderedCountryGroups.map(g => g.country.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {reorderedCountryGroups.map(({ country, visas }) => {
                      const activeCount = visas.filter(v => v.is_active).length;
                      return (
                        <SortableCountryGroup
                          key={country.id}
                          country={country}
                          visaCount={visas.length}
                          activeCount={activeCount}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
            <div className="space-y-3">
              {groupedByCountry.map(({ country, visas }) => {
                const isExpanded = expandedCountries.includes(country.id);
                const activeCount = visas.filter(v => v.is_active).length;
                
                return (
                  <Collapsible 
                    key={country.id} 
                    open={isExpanded}
                    onOpenChange={() => toggleCountry(country.id)}
                  >
                    <div className="border rounded-lg overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <div className={cn(
                          "flex items-center justify-between p-4 cursor-pointer transition-colors",
                          isExpanded ? "bg-primary/5 border-b" : "hover:bg-muted/50"
                        )}>
                          <div className="flex items-center gap-3">
                            {country.flag_url && (
                              <img src={country.flag_url} alt="" className="h-6 w-9 rounded shadow-sm" />
                            )}
                            <div>
                              <h3 className="font-semibold text-lg">{country.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {visas.length} نوع تأشيرة • {activeCount} نشطة
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={activeCount === visas.length ? "default" : "secondary"} className="gap-1">
                              {activeCount === visas.length ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <span>{activeCount}/{visas.length}</span>
                              )}
                            </Badge>
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        {/* زر تغيير الترتيب */}
                        <div className="flex items-center justify-between p-3 bg-muted/30 border-b">
                          {reorderCountryId === country.id ? (
                            <div className="flex items-center gap-2 w-full justify-between">
                              <span className="text-sm text-muted-foreground flex items-center gap-2">
                                <GripVertical className="h-4 w-4" />
                                اسحب العناصر لتغيير الترتيب
                              </span>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={saveVisaOrder}
                                  disabled={reorderVisasMutation.isPending}
                                  className="gap-1"
                                >
                                  {reorderVisasMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3 w-3" />
                                  )}
                                  حفظ الترتيب
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={cancelVisaReorder}
                                  className="gap-1"
                                >
                                  <XCircle className="h-3 w-3" />
                                  إلغاء
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startReorderVisas(country.id, visas)}
                              className="gap-2"
                            >
                              <ArrowUpDown className="h-4 w-4" />
                              تغيير ترتيب التأشيرات
                            </Button>
                          )}
                        </div>

                        {/* عرض التأشيرات */}
                        {reorderCountryId === country.id ? (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleVisaDragEnd}
                          >
                            <SortableContext
                              items={reorderedVisas.map(v => v.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="divide-y">
                                {reorderedVisas.map((visa) => (
                                  <SortableVisaRow
                                    key={visa.id}
                                    visa={visa}
                                    isReorderMode={true}
                                    onEdit={openEdit}
                                    onDelete={(v) => {
                                      setVisaToDelete(v);
                                      setDeleteDialogOpen(true);
                                    }}
                                    onDuplicate={duplicateVisa}
                                    onToggleActive={(id, is_active) => toggleActiveMutation.mutate({ id, is_active })}
                                    onInlineEditStart={startInlineEdit}
                                    inlineEditingId={inlineEditingId}
                                    inlinePrice={inlinePrice}
                                    setInlinePrice={setInlinePrice}
                                    onInlineSave={saveInlinePrice}
                                    onInlineCancel={() => setInlineEditingId(null)}
                                    updatePricePending={updatePriceMutation.isPending}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        ) : (
                          <div className="divide-y">
                            {visas
                              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                              .map((visa) => (
                              <SortableVisaRow
                                key={visa.id}
                                visa={visa}
                                isReorderMode={false}
                                onEdit={openEdit}
                                onDelete={(v) => {
                                  setVisaToDelete(v);
                                  setDeleteDialogOpen(true);
                                }}
                                onDuplicate={duplicateVisa}
                                onToggleActive={(id, is_active) => toggleActiveMutation.mutate({ id, is_active })}
                                onInlineEditStart={startInlineEdit}
                                inlineEditingId={inlineEditingId}
                                inlinePrice={inlinePrice}
                                setInlinePrice={setInlinePrice}
                                onInlineSave={saveInlinePrice}
                                onInlineCancel={() => setInlineEditingId(null)}
                                updatePricePending={updatePriceMutation.isPending}
                              />
                            ))}
                          </div>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
            )
          ) : (
            <div className="text-center py-16">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {searchQuery || filterCountry !== 'all' || filterStatus !== 'all' 
                  ? 'لا توجد نتائج تطابق البحث' 
                  : 'لا توجد أنواع تأشيرات'}
              </p>
              {!searchQuery && filterCountry === 'all' && filterStatus === 'all' && (
                <Button className="mt-4 gap-2" onClick={() => setIsOpen(true)}>
                  <Plus className="h-4 w-4" />
                  أضف أول نوع تأشيرة
                </Button>
              )}
              {(searchQuery || filterCountry !== 'all' || filterStatus !== 'all') && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterCountry('all');
                    setFilterStatus('all');
                  }}
                >
                  إلغاء الفلترة
                </Button>
              )}
            </div>
          )}
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
                      <Select
                        value={formData.name}
                        onValueChange={(value) => setFormData({ ...formData, name: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع التأشيرة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="تأشيرة سياحية">تأشيرة سياحية</SelectItem>
                          <SelectItem value="تأشيرة دراسة">تأشيرة دراسة</SelectItem>
                          <SelectItem value="تأشيرة علاج">تأشيرة علاج</SelectItem>
                          <SelectItem value="تأشيرة عمل">تأشيرة عمل</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked === true })}
                          className="h-5 w-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                        />
                        <span className="flex items-center gap-2">
                          {formData.is_active ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          نوع التأشيرة نشط
                        </span>
                      </label>
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

                  {/* نوع الرسوم - قسم موحد */}
                  <div className="space-y-3">
                    <Label className="font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      هل السعر يشمل رسوم التأشيرة الحكومية؟
                    </Label>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* خيار: شامل */}
                      <div
                        onClick={() => {
                          setFormData({
                            ...formData,
                            fee_type: 'included',
                            government_fees: '0',
                            price_notes: 'شامل رسوم التأشيرة',
                            price_notes_en: 'Visa fees included',
                          });
                        }}
                        className={cn(
                          "p-4 rounded-lg border-2 cursor-pointer transition-all text-center",
                          formData.fee_type === 'included'
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                            : "border-border hover:border-emerald-300"
                        )}
                      >
                        <CheckCircle2 className={cn(
                          "h-8 w-8 mx-auto mb-2",
                          formData.fee_type === 'included' ? "text-emerald-500" : "text-muted-foreground/40"
                        )} />
                        <p className="font-semibold text-sm">نعم، شامل</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          السعر يشمل كل الرسوم
                        </p>
                      </div>

                      {/* خيار: منفصل */}
                      <div
                        onClick={() => {
                          setFormData({
                            ...formData,
                            fee_type: 'separate',
                            price_notes: 'رسوم التأشيرة تُدفع للسفارة مباشرة',
                            price_notes_en: 'Visa fees paid directly to embassy',
                          });
                        }}
                        className={cn(
                          "p-4 rounded-lg border-2 cursor-pointer transition-all text-center",
                          formData.fee_type === 'separate'
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                            : "border-border hover:border-amber-300"
                        )}
                      >
                        <DollarSign className={cn(
                          "h-8 w-8 mx-auto mb-2",
                          formData.fee_type === 'separate' ? "text-amber-500" : "text-muted-foreground/40"
                        )} />
                        <p className="font-semibold text-sm">لا، منفصل</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          العميل يدفعها للسفارة مباشرة
                        </p>
                      </div>
                    </div>

                    {/* حقل مبلغ الرسوم الحكومية - يظهر فقط عند اختيار منفصل */}
                    {formData.fee_type === 'separate' && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 space-y-3">
                        <Label className="text-amber-800 dark:text-amber-200 text-sm">
                          مبلغ الرسوم الحكومية التقديري (للعرض فقط - لا يُضاف للإجمالي)
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={formData.government_fees}
                            onChange={(e) => setFormData({ ...formData, government_fees: e.target.value })}
                            placeholder="مثال: 640"
                            className="pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            ر.س
                          </span>
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          💡 هذا المبلغ يظهر للعميل كمعلومة تقديرية فقط ولا يُحسب ضمن إجمالي الطلب
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ملاحظة السعر المخصصة */}
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      ✏️ ملاحظة السعر (تظهر للعميل أسفل السعر)
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={formData.price_notes || ''}
                        onChange={(e) => setFormData({ ...formData, price_notes: e.target.value })}
                        placeholder="الملاحظة بالعربي"
                      />
                      <Input
                        value={formData.price_notes_en || ''}
                        onChange={(e) => setFormData({ ...formData, price_notes_en: e.target.value })}
                        placeholder="Note in English"
                        dir="ltr"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      يتم تعبئتها تلقائياً بناءً على اختيارك أعلاه، ويمكنك تعديلها يدوياً
                    </p>
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
    </TooltipProvider>
  );
}
