import { useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Flame, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import SARSymbol from '@/components/ui/SARSymbol';
import {
  useAllSpecialOffers,
  useCreateOffer,
  useUpdateOffer,
  useDeleteOffer,
  SpecialOffer,
} from '@/hooks/useSpecialOffers';

interface OfferFormData {
  title: string;
  description: string;
  discount_percentage: number;
  original_price: number;
  sale_price: number;
  country_name: string;
  flag_emoji: string;
  end_date: string;
  start_date: string;
  badge: string;
  is_hot: boolean;
  is_active: boolean;
}

const initialFormData: OfferFormData = {
  title: '',
  description: '',
  discount_percentage: 10,
  original_price: 0,
  sale_price: 0,
  country_name: '',
  flag_emoji: '🌍',
  end_date: '',
  start_date: new Date().toISOString().split('T')[0],
  badge: 'عرض خاص',
  is_hot: false,
  is_active: true,
};

function OfferForm({
  formData,
  setFormData,
  onSubmit,
  isLoading,
  submitLabel,
}: {
  formData: OfferFormData;
  setFormData: (data: OfferFormData) => void;
  onSubmit: () => void;
  isLoading: boolean;
  submitLabel: string;
}) {
  const calculateSalePrice = (original: number, discount: number) => {
    return Math.round(original * (1 - discount / 100));
  };

  const handleOriginalPriceChange = (value: number) => {
    setFormData({
      ...formData,
      original_price: value,
      sale_price: calculateSalePrice(value, formData.discount_percentage),
    });
  };

  const handleDiscountChange = (value: number) => {
    setFormData({
      ...formData,
      discount_percentage: value,
      sale_price: calculateSalePrice(formData.original_price, value),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>عنوان العرض *</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="تأشيرة دبي السياحية"
          />
        </div>
        <div className="space-y-2">
          <Label>اسم الدولة *</Label>
          <Input
            value={formData.country_name}
            onChange={(e) => setFormData({ ...formData, country_name: e.target.value })}
            placeholder="الإمارات"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>الوصف</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="وصف العرض..."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>السعر الأصلي *</Label>
          <Input
            type="number"
            value={formData.original_price}
            onChange={(e) => handleOriginalPriceChange(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>نسبة الخصم % *</Label>
          <Input
            type="number"
            min={1}
            max={99}
            value={formData.discount_percentage}
            onChange={(e) => handleDiscountChange(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>السعر بعد الخصم</Label>
          <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted">
            <span className="font-bold text-primary">{formData.sale_price}</span>
            <SARSymbol size="sm" className="text-primary" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>تاريخ البداية *</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>تاريخ الانتهاء *</Label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>إيموجي العلم</Label>
          <Input
            value={formData.flag_emoji}
            onChange={(e) => setFormData({ ...formData, flag_emoji: e.target.value })}
            placeholder="🇦🇪"
          />
        </div>
        <div className="space-y-2">
          <Label>الشارة</Label>
          <Input
            value={formData.badge}
            onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
            placeholder="عرض خاص"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_hot}
            onCheckedChange={(checked) => setFormData({ ...formData, is_hot: checked })}
          />
          <Label className="flex items-center gap-1">
            <Flame className="h-4 w-4 text-destructive" />
            عرض حار
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label>نشط</Label>
        </div>
      </div>

      <Button onClick={onSubmit} disabled={isLoading} className="w-full">
        {isLoading ? 'جاري الحفظ...' : submitLabel}
      </Button>
    </div>
  );
}

export default function OffersManagement() {
  const { data: offers, isLoading } = useAllSpecialOffers();
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const deleteOffer = useDeleteOffer();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<SpecialOffer | null>(null);
  const [formData, setFormData] = useState<OfferFormData>(initialFormData);

  const handleCreate = () => {
    if (!formData.title || !formData.country_name || !formData.end_date) {
      return;
    }
    createOffer.mutate(
      {
        ...formData,
        end_date: new Date(formData.end_date).toISOString(),
        start_date: new Date(formData.start_date).toISOString(),
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setFormData(initialFormData);
        },
      }
    );
  };

  const handleEdit = (offer: SpecialOffer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description || '',
      discount_percentage: offer.discount_percentage,
      original_price: offer.original_price,
      sale_price: offer.sale_price,
      country_name: offer.country_name,
      flag_emoji: offer.flag_emoji || '🌍',
      end_date: offer.end_date.split('T')[0],
      start_date: offer.start_date.split('T')[0],
      badge: offer.badge || 'عرض خاص',
      is_hot: offer.is_hot || false,
      is_active: offer.is_active ?? true,
    });
  };

  const handleUpdate = () => {
    if (!editingOffer) return;
    updateOffer.mutate(
      {
        id: editingOffer.id,
        ...formData,
        end_date: new Date(formData.end_date).toISOString(),
        start_date: new Date(formData.start_date).toISOString(),
      },
      {
        onSuccess: () => {
          setEditingOffer(null);
          setFormData(initialFormData);
        },
      }
    );
  };

  const handleToggleActive = (offer: SpecialOffer) => {
    updateOffer.mutate({
      id: offer.id,
      is_active: !offer.is_active,
    });
  };

  const isOfferExpired = (endDate: string) => new Date(endDate) < new Date();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة العروض الخاصة</h1>
          <p className="text-muted-foreground">إضافة وتعديل وحذف العروض والخصومات</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              إضافة عرض جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة عرض جديد</DialogTitle>
            </DialogHeader>
            <OfferForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreate}
              isLoading={createOffer.isPending}
              submitLabel="إضافة العرض"
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>العروض ({offers?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {offers && offers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العرض</TableHead>
                  <TableHead>الدولة</TableHead>
                  <TableHead>الخصم</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>تاريخ الانتهاء</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {offer.is_hot && <Flame className="h-4 w-4 text-destructive" />}
                        <span className="font-medium">{offer.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xl ml-2">{offer.flag_emoji}</span>
                      {offer.country_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{offer.discount_percentage}%</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-primary">{offer.sale_price}</span>
                        <SARSymbol size="xs" className="text-primary" />
                        <span className="text-muted-foreground line-through text-sm mr-2">
                          {offer.original_price}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={isOfferExpired(offer.end_date) ? 'text-destructive' : ''}>
                        {format(new Date(offer.end_date), 'dd MMM yyyy', { locale: ar })}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isOfferExpired(offer.end_date) ? (
                        <Badge variant="destructive">منتهي</Badge>
                      ) : offer.is_active ? (
                        <Badge variant="default">نشط</Badge>
                      ) : (
                        <Badge variant="secondary">غير نشط</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(offer)}
                          title={offer.is_active ? 'إخفاء' : 'إظهار'}
                        >
                          {offer.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Dialog
                          open={editingOffer?.id === offer.id}
                          onOpenChange={(open) => !open && setEditingOffer(null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(offer)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>تعديل العرض</DialogTitle>
                            </DialogHeader>
                            <OfferForm
                              formData={formData}
                              setFormData={setFormData}
                              onSubmit={handleUpdate}
                              isLoading={updateOffer.isPending}
                              submitLabel="حفظ التغييرات"
                            />
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف العرض</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف هذا العرض؟ لا يمكن التراجع عن هذا الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteOffer.mutate(offer.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>لا توجد عروض حالياً</p>
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة أول عرض
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
