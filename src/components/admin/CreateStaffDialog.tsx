import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { filterArabicChars, filterNonNumeric } from '@/lib/inputFilters';
import type { AppRole } from '@/types/database';

interface CreateStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateStaffDialog({ open, onOpenChange, onSuccess }: CreateStaffDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: '' as AppRole | '',
  });

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      role: '',
    });
    setShowPassword(false);
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password || !formData.role) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-staff-user', {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          role: formData.role,
        }
      });

      // Handle edge function error response
      if (error) {
        // Try to extract error message from the response context
        const errorContext = error.context;
        if (errorContext) {
          try {
            const responseBody = await errorContext.json();
            if (responseBody?.error) {
              throw new Error(responseBody.error);
            }
          } catch (parseError) {
            // If parsing fails, use the original error
          }
        }
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'فشل في إنشاء الحساب');
      }

      toast.success('تم إنشاء حساب الموظف بنجاح');
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating staff:', error);
      const errorMessage = error.message || 'حدث خطأ في إنشاء الحساب';
      
      // Translate common error messages
      if (errorMessage.includes('already registered') || errorMessage.includes('email_exists')) {
        toast.error('هذا البريد الإلكتروني مسجل مسبقاً');
      } else if (errorMessage.includes('Invalid email')) {
        toast.error('البريد الإلكتروني غير صالح');
      } else if (errorMessage.includes('weak password') || errorMessage.includes('Password')) {
        toast.error('كلمة المرور ضعيفة جداً');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            إنشاء حساب موظف جديد
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات الموظف الجديد. سيتم إنشاء الحساب مباشرة بدون الحاجة للتحقق من البريد.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="staff_email">البريد الإلكتروني *</Label>
            <Input
              id="staff_email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                email: filterArabicChars(e.target.value) 
              }))}
              placeholder="staff@example.com"
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff_password">كلمة المرور *</Label>
            <div className="relative">
              <Input
                id="staff_password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="6 أحرف على الأقل"
                dir="ltr"
                className="text-left pl-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff_name">الاسم الكامل</Label>
            <Input
              id="staff_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="أدخل الاسم الكامل"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff_phone">رقم الجوال</Label>
            <Input
              id="staff_phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                phone: filterNonNumeric(e.target.value) 
              }))}
              placeholder="05XXXXXXXX"
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff_role">الصلاحية *</Label>
            <Select
              value={formData.role}
              onValueChange={(value: AppRole) => setFormData(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الصلاحية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agent">وكيل - مراجعة الطلبات المُعيّنة</SelectItem>
                <SelectItem value="admin">مشرف - صلاحيات كاملة على النظام</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            إنشاء الحساب
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
