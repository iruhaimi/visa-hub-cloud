import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Crown, FileText, Users, Settings, Percent, Globe, Layout, BarChart3, RefreshCcw, Unlock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { StaffPermission } from '@/types/database';
import { PERMISSION_LABELS, ALL_PERMISSIONS } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

interface EditPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSuccess: () => void;
}

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Users,
  Crown,
  Settings,
  Percent,
  Globe,
  Layout,
  BarChart3,
  RefreshCcw,
  Unlock,
  Shield,
};

export function EditPermissionsDialog({
  open,
  onOpenChange,
  userId,
  userName,
  onSuccess,
}: EditPermissionsDialogProps) {
  const { user } = useAuth();
  const { isSuperAdmin: currentUserIsSuperAdmin } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPermissions, setCurrentPermissions] = useState<StaffPermission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<StaffPermission[]>([]);
  const [superAdminCount, setSuperAdminCount] = useState(0);
  const [targetIsSuperAdmin, setTargetIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (open && userId) {
      fetchPermissions();
      fetchSuperAdminCount();
    }
  }, [open, userId]);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff_permissions')
        .select('permission')
        .eq('user_id', userId);

      if (error) throw error;

      const permissions = (data || []).map((p: any) => p.permission as StaffPermission);
      setCurrentPermissions(permissions);
      setSelectedPermissions(permissions);
      setTargetIsSuperAdmin(permissions.includes('manage_staff'));
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('حدث خطأ في جلب الصلاحيات');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuperAdminCount = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_permissions')
        .select('user_id')
        .eq('permission', 'manage_staff');

      if (!error && data) {
        const uniqueUsers = [...new Set(data.map(d => d.user_id))];
        setSuperAdminCount(uniqueUsers.length);
      }
    } catch (error) {
      console.error('Error fetching super admin count:', error);
    }
  };

  const togglePermission = (permission: StaffPermission) => {
    // Prevent removing manage_staff from last super admin
    if (permission === 'manage_staff' && targetIsSuperAdmin && superAdminCount <= 1) {
      toast.error('لا يمكن إزالة صلاحية إدارة الموظفين من آخر مدير عام');
      return;
    }
    
    setSelectedPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      }
      return [...prev, permission];
    });
  };

  const selectAllPermissions = () => {
    setSelectedPermissions([...ALL_PERMISSIONS]);
  };

  const clearAllPermissions = () => {
    // If this is the last super admin, keep manage_staff
    if (targetIsSuperAdmin && superAdminCount <= 1) {
      setSelectedPermissions(['manage_staff']);
      toast.warning('تم الاحتفاظ بصلاحية إدارة الموظفين لأنك آخر مدير عام');
      return;
    }
    setSelectedPermissions([]);
  };

  // Check if current user can edit this user's permissions
  const canEditPermissions = currentUserIsSuperAdmin;
  
  // Check if trying to remove manage_staff from last super admin
  const isRemovingLastSuperAdmin = targetIsSuperAdmin && 
    superAdminCount <= 1 && 
    !selectedPermissions.includes('manage_staff');

  const handleSave = async () => {
    // Security check: Prevent removing manage_staff from last super admin
    if (isRemovingLastSuperAdmin) {
      toast.error('لا يمكن إزالة صلاحية إدارة الموظفين من آخر مدير عام في النظام');
      return;
    }

    setSaving(true);
    try {
      // Find permissions to add and remove
      const toAdd = selectedPermissions.filter(p => !currentPermissions.includes(p));
      const toRemove = currentPermissions.filter(p => !selectedPermissions.includes(p));

      // Remove permissions
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('staff_permissions')
          .delete()
          .eq('user_id', userId)
          .in('permission', toRemove);

        if (deleteError) throw deleteError;
      }

      // Add new permissions
      if (toAdd.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        
        const newPermissions = toAdd.map(permission => ({
          user_id: userId,
          permission,
          granted_by: user?.id || null,
        }));

        const { error: insertError } = await supabase
          .from('staff_permissions')
          .insert(newPermissions);

        if (insertError) throw insertError;
      }

      toast.success('تم تحديث الصلاحيات بنجاح');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast.error(error.message || 'حدث خطأ في حفظ الصلاحيات');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify([...currentPermissions].sort()) !== JSON.stringify([...selectedPermissions].sort());
  const isSuperAdmin = selectedPermissions.includes('manage_staff');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            تعديل صلاحيات الموظف
          </DialogTitle>
          <DialogDescription>
            تعديل صلاحيات <span className="font-semibold text-foreground">{userName || 'الموظف'}</span>
          </DialogDescription>
        </DialogHeader>

        {!canEditPermissions ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              ليس لديك صلاحية تعديل صلاحيات الموظفين. هذه الميزة متاحة فقط للمدراء العامين.
            </AlertDescription>
          </Alert>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Warning for last super admin */}
            {targetIsSuperAdmin && superAdminCount <= 1 && (
              <Alert className="mb-4 border-warning/50 bg-warning/10">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-warning">
                  <strong>تحذير:</strong> هذا هو المدير العام الوحيد في النظام. لا يمكن إزالة صلاحية إدارة الموظفين منه.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllPermissions}
                  className="text-xs"
                >
                  تحديد الكل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllPermissions}
                  className="text-xs"
                >
                  إلغاء الكل
                </Button>
              </div>
              {isSuperAdmin && (
                <Badge variant="destructive" className="gap-1">
                  <Crown className="h-3 w-3" />
                  مدير عام
                </Badge>
              )}
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {ALL_PERMISSIONS.map((permission) => {
                  const config = PERMISSION_LABELS[permission];
                  const IconComponent = IconMap[config.icon] || Shield;
                  const isSelected = selectedPermissions.includes(permission);
                  const isManageStaff = permission === 'manage_staff';

                  return (
                    <div
                      key={permission}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? isManageStaff
                            ? 'border-destructive/50 bg-destructive/5'
                            : 'border-primary/50 bg-primary/5'
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                      onClick={() => togglePermission(permission)}
                    >
                      <Checkbox
                        id={permission}
                        checked={isSelected}
                        onCheckedChange={() => togglePermission(permission)}
                        className={isManageStaff ? 'border-destructive data-[state=checked]:bg-destructive' : ''}
                      />
                      <div className={`p-2 rounded-lg ${
                        isSelected
                          ? isManageStaff
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={permission}
                          className={`font-medium cursor-pointer flex items-center gap-2 ${
                            isManageStaff ? 'text-destructive' : ''
                          }`}
                        >
                          {config.label}
                          {isManageStaff && (
                            <Crown className="h-3.5 w-3.5" />
                          )}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {config.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {isSuperAdmin && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mt-2">
                <p className="text-xs text-warning">
                  ⚠️ <strong>تحذير:</strong> صلاحية "إدارة الموظفين" تمنح هذا الموظف كامل الصلاحيات على النظام كمدير عام.
                </p>
              </div>
            )}
          </>
        )}

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !hasChanges || !canEditPermissions || isRemovingLastSuperAdmin}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            حفظ التغييرات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
