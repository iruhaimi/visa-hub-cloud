import { useState, useEffect } from 'react';
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
import { Loader2, Trash2, AlertTriangle, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AppRole } from '@/types/database';
import { usePermissions } from '@/hooks/usePermissions';

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
  const [checkingPermissions, setCheckingPermissions] = useState(false);
  const [targetIsSuperAdmin, setTargetIsSuperAdmin] = useState(false);
  const [superAdminCount, setSuperAdminCount] = useState(0);
  const { isSuperAdmin: currentUserIsSuperAdmin } = usePermissions();

  useEffect(() => {
    if (open && user) {
      checkTargetPermissions();
    }
  }, [open, user]);

  const checkTargetPermissions = async () => {
    if (!user) return;
    
    setCheckingPermissions(true);
    try {
      // Check if target user is a super admin
      const { data: targetPerms } = await supabase
        .from('staff_permissions')
        .select('permission')
        .eq('user_id', user.user_id)
        .eq('permission', 'manage_staff');

      setTargetIsSuperAdmin((targetPerms?.length || 0) > 0);

      // Count total super admins
      const { data: allSuperAdmins } = await supabase
        .from('staff_permissions')
        .select('user_id')
        .eq('permission', 'manage_staff');

      const uniqueUsers = [...new Set(allSuperAdmins?.map(d => d.user_id) || [])];
      setSuperAdminCount(uniqueUsers.length);
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setCheckingPermissions(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    // Extra security check: Prevent deleting last super admin
    if (targetIsSuperAdmin && superAdminCount <= 1) {
      toast.error('لا يمكن حذف آخر مدير عام في النظام');
      return;
    }

    // Check if current user has permission
    if (!currentUserIsSuperAdmin) {
      toast.error('ليس لديك صلاحية حذف الموظفين');
      return;
    }

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

  const isLastSuperAdmin = targetIsSuperAdmin && superAdminCount <= 1;
  const canDelete = currentUserIsSuperAdmin && !isLastSuperAdmin;

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
            
            {checkingPermissions ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : isLastSuperAdmin ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mt-3">
                <p className="text-destructive text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  لا يمكن حذف آخر مدير عام
                </p>
                <p className="text-destructive/80 text-sm mt-2">
                  هذا المستخدم هو المدير العام الوحيد في النظام. يجب تعيين مدير عام آخر قبل حذف هذا الحساب.
                </p>
              </div>
            ) : !currentUserIsSuperAdmin ? (
              <div className="bg-warning/10 border border-warning/20 rounded-md p-3 mt-3">
                <p className="text-warning text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  ليس لديك صلاحية
                </p>
                <p className="text-warning/80 text-sm mt-2">
                  حذف حسابات الموظفين متاح فقط للمدراء العامين (من يملك صلاحية إدارة الموظفين).
                </p>
              </div>
            ) : (
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
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={loading}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={loading || !canDelete || checkingPermissions}
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
