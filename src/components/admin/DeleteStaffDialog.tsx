import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AppRole } from '@/types/database';

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  nationality: string | null;
  created_at: string;
  roles: AppRole[];
}

interface DeleteStaffDialogProps {
  user: UserWithRole | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteStaffDialog({ user, open, onOpenChange, onSuccess }: DeleteStaffDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-staff-user', {
        body: { user_id: user.user_id }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'فشل في حذف الحساب');
      }

      toast.success('تم حذف حساب الموظف نهائياً');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      toast.error(error.message || 'حدث خطأ في حذف الحساب');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            حذف حساب الموظف نهائياً
          </AlertDialogTitle>
          <AlertDialogDescription className="text-right space-y-2">
            <p>
              هل أنت متأكد من حذف حساب <strong>{user.full_name || 'هذا الموظف'}</strong> نهائياً من النظام؟
            </p>
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mt-3">
              <p className="text-destructive text-sm font-medium">
                ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه!
              </p>
              <ul className="text-destructive/80 text-sm mt-2 list-disc list-inside space-y-1">
                <li>سيتم حذف الحساب من النظام بالكامل</li>
                <li>سيفقد الموظف الوصول إلى لوحة التحكم</li>
                <li>لن يتمكن من تسجيل الدخول مرة أخرى</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={loading}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            <Trash2 className="h-4 w-4 ml-2" />
            حذف نهائياً
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
