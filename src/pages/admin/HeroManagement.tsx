import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Image, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HeroDestination {
  id: string;
  name: string;
  name_en: string | null;
  country: string;
  country_en: string | null;
  image_url: string;
  display_order: number;
  is_active: boolean;
  link_url: string | null;
  created_at: string;
}

export default function HeroManagement() {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<HeroDestination | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    country: '',
    country_en: '',
    image_url: '',
    display_order: 0,
    is_active: true,
    link_url: '/destinations',
  });

  // Fetch destinations
  const { data: destinations, isLoading } = useQuery({
    queryKey: ['admin-hero-destinations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_destinations')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as HeroDestination[];
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      name_en: '',
      country: '',
      country_en: '',
      image_url: '',
      display_order: destinations?.length || 0,
      is_active: true,
      link_url: '/destinations',
    });
    setEditingDestination(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const openEdit = (destination: HeroDestination) => {
    setEditingDestination(destination);
    setFormData({
      name: destination.name,
      name_en: destination.name_en || '',
      country: destination.country,
      country_en: destination.country_en || '',
      image_url: destination.image_url,
      display_order: destination.display_order,
      is_active: destination.is_active,
      link_url: destination.link_url || '/destinations',
    });
    setImagePreview(destination.image_url);
    setIsOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الصورة يجب أن يكون أقل من 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `hero-${Date.now()}.${fileExt}`;
    const filePath = `hero-destinations/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      setIsUploading(true);
      let finalImageUrl = formData.image_url;

      // Upload new image if selected
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const payload = {
        name: formData.name,
        name_en: formData.name_en || null,
        country: formData.country,
        country_en: formData.country_en || null,
        image_url: finalImageUrl,
        display_order: formData.display_order,
        is_active: formData.is_active,
        link_url: formData.link_url || '/destinations',
      };

      if (editingDestination) {
        const { error } = await supabase
          .from('hero_destinations')
          .update(payload)
          .eq('id', editingDestination.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hero_destinations')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-destinations'] });
      queryClient.invalidateQueries({ queryKey: ['hero-destinations'] });
      toast.success(editingDestination ? 'تم تحديث الوجهة بنجاح' : 'تم إضافة الوجهة بنجاح');
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hero_destinations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-destinations'] });
      queryClient.invalidateQueries({ queryKey: ['hero-destinations'] });
      toast.success('تم حذف الوجهة بنجاح');
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('hero_destinations')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-destinations'] });
      queryClient.invalidateQueries({ queryKey: ['hero-destinations'] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from('hero_destinations')
        .update({ display_order: newOrder })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-destinations'] });
      queryClient.invalidateQueries({ queryKey: ['hero-destinations'] });
    },
  });

  const moveUp = (destination: HeroDestination, index: number) => {
    if (index === 0 || !destinations) return;
    const prevDest = destinations[index - 1];
    reorderMutation.mutate({ id: destination.id, newOrder: prevDest.display_order });
    reorderMutation.mutate({ id: prevDest.id, newOrder: destination.display_order });
  };

  const moveDown = (destination: HeroDestination, index: number) => {
    if (!destinations || index === destinations.length - 1) return;
    const nextDest = destinations[index + 1];
    reorderMutation.mutate({ id: destination.id, newOrder: nextDest.display_order });
    reorderMutation.mutate({ id: nextDest.id, newOrder: destination.display_order });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", isRTL && "text-right")}>
      <div>
        <h1 className="text-2xl font-bold">إدارة قسم Hero</h1>
        <p className="text-muted-foreground">إضافة وتعديل وحذف الوجهات في شريط العرض الرئيسي</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            الوجهات المميزة
          </CardTitle>
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة وجهة
              </Button>
            </DialogTrigger>
            <DialogContent className={cn("max-w-lg", isRTL && "text-right")}>
              <DialogHeader>
                <DialogTitle>{editingDestination ? 'تعديل الوجهة' : 'إضافة وجهة جديدة'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>صورة الوجهة</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="h-40 w-full object-cover rounded-lg mx-auto"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 left-2"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                            setFormData({ ...formData, image_url: '' });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block py-8">
                        <Image className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">اضغط لرفع صورة</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">الحد الأقصى: 5MB - يُفضل أبعاد 800x1000</p>
                </div>

                {/* Or URL */}
                <div className="space-y-2">
                  <Label>أو رابط الصورة</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => {
                      setFormData({ ...formData, image_url: e.target.value });
                      setImagePreview(e.target.value);
                      setImageFile(null);
                    }}
                    placeholder="https://..."
                    dir="ltr"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم الوجهة (عربي)</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="مثال: دبي"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>اسم الوجهة (إنجليزي)</Label>
                    <Input
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      placeholder="e.g., Dubai"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الدولة (عربي)</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="مثال: الإمارات"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الدولة (إنجليزي)</Label>
                    <Input
                      value={formData.country_en}
                      onChange={(e) => setFormData({ ...formData, country_en: e.target.value })}
                      placeholder="e.g., UAE"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>رابط الوجهة</Label>
                  <Input
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="/destinations"
                    dir="ltr"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>عرض الوجهة</Label>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || isUploading || !formData.name || !formData.country || (!formData.image_url && !imageFile)}
                >
                  {(saveMutation.isPending || isUploading) ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      جاري الحفظ...
                    </>
                  ) : (
                    editingDestination ? 'حفظ التغييرات' : 'إضافة الوجهة'
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
                <TableHead className={isRTL ? "text-right" : ""}>الترتيب</TableHead>
                <TableHead className={isRTL ? "text-right" : ""}>الصورة</TableHead>
                <TableHead className={isRTL ? "text-right" : ""}>الوجهة</TableHead>
                <TableHead className={isRTL ? "text-right" : ""}>الدولة</TableHead>
                <TableHead className={isRTL ? "text-right" : ""}>الحالة</TableHead>
                <TableHead className={isRTL ? "text-right" : ""}>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {destinations?.map((dest, index) => (
                <TableRow key={dest.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveUp(dest, index)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center">{index + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveDown(dest, index)}
                        disabled={index === destinations.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <img 
                      src={dest.image_url} 
                      alt={dest.name}
                      className="h-12 w-16 object-cover rounded-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <div>{dest.name}</div>
                      {dest.name_en && (
                        <div className="text-xs text-muted-foreground" dir="ltr">{dest.name_en}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{dest.country}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={dest.is_active}
                        onCheckedChange={(checked) => 
                          toggleActiveMutation.mutate({ id: dest.id, is_active: checked })
                        }
                      />
                      {dest.is_active ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(dest)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => {
                          if (confirm('هل أنت متأكد من حذف هذه الوجهة؟')) {
                            deleteMutation.mutate(dest.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!destinations || destinations.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    لا توجد وجهات مضافة
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
