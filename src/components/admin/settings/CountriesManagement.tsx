import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  Globe, 
  Search,
  Check,
  ChevronsUpDown,
  MapPin,
  Flag,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// قائمة الدول العالمية مع أكوادها
const WORLD_COUNTRIES = [
  { name: 'الإمارات العربية المتحدة', nameEn: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' },
  { name: 'السعودية', nameEn: 'Saudi Arabia', code: 'SA', flag: '🇸🇦' },
  { name: 'مصر', nameEn: 'Egypt', code: 'EG', flag: '🇪🇬' },
  { name: 'الأردن', nameEn: 'Jordan', code: 'JO', flag: '🇯🇴' },
  { name: 'لبنان', nameEn: 'Lebanon', code: 'LB', flag: '🇱🇧' },
  { name: 'المغرب', nameEn: 'Morocco', code: 'MA', flag: '🇲🇦' },
  { name: 'تونس', nameEn: 'Tunisia', code: 'TN', flag: '🇹🇳' },
  { name: 'الجزائر', nameEn: 'Algeria', code: 'DZ', flag: '🇩🇿' },
  { name: 'الكويت', nameEn: 'Kuwait', code: 'KW', flag: '🇰🇼' },
  { name: 'قطر', nameEn: 'Qatar', code: 'QA', flag: '🇶🇦' },
  { name: 'البحرين', nameEn: 'Bahrain', code: 'BH', flag: '🇧🇭' },
  { name: 'عمان', nameEn: 'Oman', code: 'OM', flag: '🇴🇲' },
  { name: 'العراق', nameEn: 'Iraq', code: 'IQ', flag: '🇮🇶' },
  { name: 'اليمن', nameEn: 'Yemen', code: 'YE', flag: '🇾🇪' },
  { name: 'سوريا', nameEn: 'Syria', code: 'SY', flag: '🇸🇾' },
  { name: 'فلسطين', nameEn: 'Palestine', code: 'PS', flag: '🇵🇸' },
  { name: 'ليبيا', nameEn: 'Libya', code: 'LY', flag: '🇱🇾' },
  { name: 'السودان', nameEn: 'Sudan', code: 'SD', flag: '🇸🇩' },
  { name: 'تركيا', nameEn: 'Turkey', code: 'TR', flag: '🇹🇷' },
  { name: 'بريطانيا', nameEn: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
  { name: 'فرنسا', nameEn: 'France', code: 'FR', flag: '🇫🇷' },
  { name: 'ألمانيا', nameEn: 'Germany', code: 'DE', flag: '🇩🇪' },
  { name: 'إيطاليا', nameEn: 'Italy', code: 'IT', flag: '🇮🇹' },
  { name: 'إسبانيا', nameEn: 'Spain', code: 'ES', flag: '🇪🇸' },
  { name: 'هولندا', nameEn: 'Netherlands', code: 'NL', flag: '🇳🇱' },
  { name: 'بلجيكا', nameEn: 'Belgium', code: 'BE', flag: '🇧🇪' },
  { name: 'النمسا', nameEn: 'Austria', code: 'AT', flag: '🇦🇹' },
  { name: 'سويسرا', nameEn: 'Switzerland', code: 'CH', flag: '🇨🇭' },
  { name: 'البرتغال', nameEn: 'Portugal', code: 'PT', flag: '🇵🇹' },
  { name: 'اليونان', nameEn: 'Greece', code: 'GR', flag: '🇬🇷' },
  { name: 'بولندا', nameEn: 'Poland', code: 'PL', flag: '🇵🇱' },
  { name: 'التشيك', nameEn: 'Czech Republic', code: 'CZ', flag: '🇨🇿' },
  { name: 'السويد', nameEn: 'Sweden', code: 'SE', flag: '🇸🇪' },
  { name: 'الدنمارك', nameEn: 'Denmark', code: 'DK', flag: '🇩🇰' },
  { name: 'النرويج', nameEn: 'Norway', code: 'NO', flag: '🇳🇴' },
  { name: 'فنلندا', nameEn: 'Finland', code: 'FI', flag: '🇫🇮' },
  { name: 'روسيا', nameEn: 'Russia', code: 'RU', flag: '🇷🇺' },
  { name: 'أوكرانيا', nameEn: 'Ukraine', code: 'UA', flag: '🇺🇦' },
  { name: 'الولايات المتحدة', nameEn: 'United States', code: 'US', flag: '🇺🇸' },
  { name: 'كندا', nameEn: 'Canada', code: 'CA', flag: '🇨🇦' },
  { name: 'المكسيك', nameEn: 'Mexico', code: 'MX', flag: '🇲🇽' },
  { name: 'البرازيل', nameEn: 'Brazil', code: 'BR', flag: '🇧🇷' },
  { name: 'الأرجنتين', nameEn: 'Argentina', code: 'AR', flag: '🇦🇷' },
  { name: 'الهند', nameEn: 'India', code: 'IN', flag: '🇮🇳' },
  { name: 'باكستان', nameEn: 'Pakistan', code: 'PK', flag: '🇵🇰' },
  { name: 'بنغلاديش', nameEn: 'Bangladesh', code: 'BD', flag: '🇧🇩' },
  { name: 'الصين', nameEn: 'China', code: 'CN', flag: '🇨🇳' },
  { name: 'اليابان', nameEn: 'Japan', code: 'JP', flag: '🇯🇵' },
  { name: 'كوريا الجنوبية', nameEn: 'South Korea', code: 'KR', flag: '🇰🇷' },
  { name: 'ماليزيا', nameEn: 'Malaysia', code: 'MY', flag: '🇲🇾' },
  { name: 'إندونيسيا', nameEn: 'Indonesia', code: 'ID', flag: '🇮🇩' },
  { name: 'تايلاند', nameEn: 'Thailand', code: 'TH', flag: '🇹🇭' },
  { name: 'سنغافورة', nameEn: 'Singapore', code: 'SG', flag: '🇸🇬' },
  { name: 'فيتنام', nameEn: 'Vietnam', code: 'VN', flag: '🇻🇳' },
  { name: 'الفلبين', nameEn: 'Philippines', code: 'PH', flag: '🇵🇭' },
  { name: 'أستراليا', nameEn: 'Australia', code: 'AU', flag: '🇦🇺' },
  { name: 'نيوزيلندا', nameEn: 'New Zealand', code: 'NZ', flag: '🇳🇿' },
  { name: 'جنوب أفريقيا', nameEn: 'South Africa', code: 'ZA', flag: '🇿🇦' },
  { name: 'نيجيريا', nameEn: 'Nigeria', code: 'NG', flag: '🇳🇬' },
  { name: 'كينيا', nameEn: 'Kenya', code: 'KE', flag: '🇰🇪' },
  { name: 'إثيوبيا', nameEn: 'Ethiopia', code: 'ET', flag: '🇪🇹' },
  { name: 'أذربيجان', nameEn: 'Azerbaijan', code: 'AZ', flag: '🇦🇿' },
  { name: 'جورجيا', nameEn: 'Georgia', code: 'GE', flag: '🇬🇪' },
  { name: 'أرمينيا', nameEn: 'Armenia', code: 'AM', flag: '🇦🇲' },
  { name: 'كازاخستان', nameEn: 'Kazakhstan', code: 'KZ', flag: '🇰🇿' },
  { name: 'أوزبكستان', nameEn: 'Uzbekistan', code: 'UZ', flag: '🇺🇿' },
  { name: 'إيران', nameEn: 'Iran', code: 'IR', flag: '🇮🇷' },
  { name: 'أفغانستان', nameEn: 'Afghanistan', code: 'AF', flag: '🇦🇫' },
  { name: 'سريلانكا', nameEn: 'Sri Lanka', code: 'LK', flag: '🇱🇰' },
  { name: 'نيبال', nameEn: 'Nepal', code: 'NP', flag: '🇳🇵' },
  { name: 'المالديف', nameEn: 'Maldives', code: 'MV', flag: '🇲🇻' },
  { name: 'قبرص', nameEn: 'Cyprus', code: 'CY', flag: '🇨🇾' },
  { name: 'مالطا', nameEn: 'Malta', code: 'MT', flag: '🇲🇹' },
  { name: 'آيسلندا', nameEn: 'Iceland', code: 'IS', flag: '🇮🇸' },
  { name: 'إيرلندا', nameEn: 'Ireland', code: 'IE', flag: '🇮🇪' },
  { name: 'المجر', nameEn: 'Hungary', code: 'HU', flag: '🇭🇺' },
  { name: 'رومانيا', nameEn: 'Romania', code: 'RO', flag: '🇷🇴' },
  { name: 'بلغاريا', nameEn: 'Bulgaria', code: 'BG', flag: '🇧🇬' },
  { name: 'كرواتيا', nameEn: 'Croatia', code: 'HR', flag: '🇭🇷' },
  { name: 'صربيا', nameEn: 'Serbia', code: 'RS', flag: '🇷🇸' },
  { name: 'سلوفينيا', nameEn: 'Slovenia', code: 'SI', flag: '🇸🇮' },
  { name: 'سلوفاكيا', nameEn: 'Slovakia', code: 'SK', flag: '🇸🇰' },
  { name: 'لاتفيا', nameEn: 'Latvia', code: 'LV', flag: '🇱🇻' },
  { name: 'ليتوانيا', nameEn: 'Lithuania', code: 'LT', flag: '🇱🇹' },
  { name: 'إستونيا', nameEn: 'Estonia', code: 'EE', flag: '🇪🇪' },
  { name: 'البوسنة والهرسك', nameEn: 'Bosnia and Herzegovina', code: 'BA', flag: '🇧🇦' },
  { name: 'الجبل الأسود', nameEn: 'Montenegro', code: 'ME', flag: '🇲🇪' },
  { name: 'ألبانيا', nameEn: 'Albania', code: 'AL', flag: '🇦🇱' },
  { name: 'مقدونيا الشمالية', nameEn: 'North Macedonia', code: 'MK', flag: '🇲🇰' },
  { name: 'كوسوفو', nameEn: 'Kosovo', code: 'XK', flag: '🇽🇰' },
  { name: 'موريتانيا', nameEn: 'Mauritania', code: 'MR', flag: '🇲🇷' },
  { name: 'جيبوتي', nameEn: 'Djibouti', code: 'DJ', flag: '🇩🇯' },
  { name: 'الصومال', nameEn: 'Somalia', code: 'SO', flag: '🇸🇴' },
  { name: 'جزر القمر', nameEn: 'Comoros', code: 'KM', flag: '🇰🇲' },
];

export interface Country {
  id: string;
  name: string;
  code: string;
  flag_url: string | null;
  is_active: boolean;
}

interface CountriesManagementProps {
  countries: Country[];
  isLoading: boolean;
  isRTL: boolean;
}

export function CountriesManagement({ countries, isLoading, isRTL }: CountriesManagementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState<Country | null>(null);
  const [useCustomCountry, setUseCustomCountry] = useState(false);
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
    setUseCustomCountry(false);
  };

  const openEdit = (country: Country) => {
    setEditingCountry(country);
    setFormData({
      name: country.name,
      code: country.code,
      flag_url: country.flag_url || '',
      is_active: country.is_active,
    });
    setUseCustomCountry(true); // للسماح بتعديل الاسم
    setIsOpen(true);
  };

  const selectPredefinedCountry = (country: typeof WORLD_COUNTRIES[0]) => {
    setFormData({
      ...formData,
      name: country.name,
      code: country.code,
      flag_url: `https://flagcdn.com/w80/${country.code.toLowerCase()}.png`,
    });
    setCountryPickerOpen(false);
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
      setDeleteDialogOpen(false);
      setCountryToDelete(null);
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
      toast.success('تم تحديث الحالة');
    },
  });

  // فلترة الدول المتاحة (غير المضافة مسبقاً)
  const availableCountries = WORLD_COUNTRIES.filter(
    wc => !countries.some(c => c.code.toUpperCase() === wc.code.toUpperCase())
  );

  // فلترة حسب البحث
  const filteredCountries = searchQuery
    ? countries.filter(c => 
        c.name.includes(searchQuery) || 
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : countries;

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
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">إدارة الدول</CardTitle>
                <CardDescription>
                  {countries.length} دولة مسجلة • {countries.filter(c => c.is_active).length} نشطة
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={() => setIsOpen(true)} 
              className="gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              إضافة دولة
            </Button>
          </div>

          {/* شريط البحث */}
          <div className="relative mt-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن دولة..."
              className="pr-10 bg-background"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className={cn("font-semibold", isRTL && "text-right")}>
                    الدولة
                  </TableHead>
                  <TableHead className={cn("font-semibold", isRTL && "text-right")}>
                    الرمز
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
                {filteredCountries.map((country) => (
                  <TableRow key={country.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {country.flag_url ? (
                          <img 
                            src={country.flag_url} 
                            alt="" 
                            className="h-6 w-9 object-cover rounded shadow-sm border"
                          />
                        ) : (
                          <div className="h-6 w-9 bg-muted rounded flex items-center justify-center">
                            <Flag className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium">{country.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {country.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={country.is_active}
                          onCheckedChange={(checked) => 
                            toggleActiveMutation.mutate({ id: country.id, is_active: checked })
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          {country.is_active ? (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <Eye className="h-3 w-3" /> نشطة
                            </span>
                          ) : (
                            <span className="text-amber-600 flex items-center gap-1">
                              <EyeOff className="h-3 w-3" /> مخفية
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
                              onClick={() => openEdit(country)}
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
                                setCountryToDelete(country);
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
                {filteredCountries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <MapPin className="h-10 w-10 opacity-50" />
                        <p>{searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد دول مضافة'}</p>
                        {!searchQuery && (
                          <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
                            <Plus className="h-4 w-4 ml-1" />
                            أضف أول دولة
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

      {/* Dialog إضافة/تعديل دولة */}
      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
        <DialogContent className={cn("sm:max-w-md", isRTL && "text-right")}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              {editingCountry ? 'تعديل الدولة' : 'إضافة دولة جديدة'}
            </DialogTitle>
            <DialogDescription>
              {editingCountry 
                ? 'قم بتعديل بيانات الدولة' 
                : 'اختر من القائمة أو أضف دولة مخصصة'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!editingCountry && (
              <>
                {/* اختيار من القائمة */}
                <div className="space-y-2">
                  <Label>اختر من القائمة</Label>
                  <Popover open={countryPickerOpen} onOpenChange={setCountryPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !formData.name && "text-muted-foreground"
                        )}
                        disabled={useCustomCountry}
                      >
                        {formData.name && !useCustomCountry ? (
                          <span className="flex items-center gap-2">
                            {formData.flag_url && (
                              <img src={formData.flag_url} alt="" className="h-4 w-6 rounded" />
                            )}
                            {formData.name}
                          </span>
                        ) : (
                          "اختر دولة..."
                        )}
                        <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="ابحث عن دولة..." />
                        <CommandList>
                          <CommandEmpty>لا توجد نتائج</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-y-auto">
                            {availableCountries.map((country) => (
                              <CommandItem
                                key={country.code}
                                value={country.name + country.nameEn}
                                onSelect={() => selectPredefinedCountry(country)}
                              >
                                <span className="text-xl ml-2">{country.flag}</span>
                                <span className="flex-1">{country.name}</span>
                                <span className="text-xs text-muted-foreground">{country.code}</span>
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.code === country.code ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex-1 h-px bg-border" />
                  <span>أو</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    id="custom-country"
                    checked={useCustomCountry}
                    onCheckedChange={(checked) => {
                      setUseCustomCountry(checked);
                      if (checked) {
                        setFormData({ ...formData, name: '', code: '', flag_url: '' });
                      }
                    }}
                  />
                  <Label htmlFor="custom-country" className="cursor-pointer">
                    إضافة دولة مخصصة غير موجودة في القائمة
                  </Label>
                </div>
              </>
            )}

            {/* حقول الإدخال اليدوي */}
            {(useCustomCountry || editingCountry) && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                <div className="space-y-2">
                  <Label>اسم الدولة <span className="text-destructive">*</span></Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: الإمارات العربية المتحدة"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رمز الدولة (ISO) <span className="text-destructive">*</span></Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="مثال: AE"
                    maxLength={3}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    رمز ISO المكون من حرفين أو ثلاثة أحرف
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>رابط العلم (اختياري)</Label>
                  <Input
                    value={formData.flag_url}
                    onChange={(e) => setFormData({ ...formData, flag_url: e.target.value })}
                    placeholder="https://flagcdn.com/w80/ae.png"
                    dir="ltr"
                  />
                  {formData.code && !formData.flag_url && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => setFormData({
                        ...formData,
                        flag_url: `https://flagcdn.com/w80/${formData.code.toLowerCase()}.png`
                      })}
                    >
                      استخدم العلم الافتراضي
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Switch
                id="is-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is-active" className="cursor-pointer flex-1">
                <span className="font-medium">الدولة نشطة</span>
                <p className="text-xs text-muted-foreground">
                  ستظهر للعملاء في قائمة الوجهات
                </p>
              </Label>
            </div>

            <Button 
              className="w-full" 
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !formData.name || !formData.code}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                editingCountry ? 'حفظ التغييرات' : 'إضافة الدولة'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* تأكيد الحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الدولة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف "{countryToDelete?.name}"؟
              <br />
              <span className="text-destructive font-medium">
                سيتم حذف جميع أنواع التأشيرات المرتبطة بهذه الدولة.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => countryToDelete && deleteMutation.mutate(countryToDelete.id)}
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
