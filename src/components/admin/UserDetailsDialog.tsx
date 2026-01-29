import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  User, 
  Phone, 
  Globe, 
  Calendar, 
  Shield, 
  FileText,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { AppRole } from '@/types/database';

interface UserData {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  nationality: string | null;
  created_at: string;
  roles: AppRole[];
}

interface UserDetailsDialogProps {
  user: UserData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_LABELS: Record<AppRole, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  customer: { label: 'عميل', variant: 'secondary' },
  agent: { label: 'وكيل', variant: 'default' },
  admin: { label: 'مشرف', variant: 'destructive' },
};

export function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps) {
  const [applicationCount, setApplicationCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && open) {
      fetchUserStats();
    }
  }, [user, open]);

  const fetchUserStats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setApplicationCount(count || 0);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            تفاصيل المستخدم
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <User className="h-4 w-4" />
                الاسم
              </div>
              <p className="font-medium">{user.full_name || 'غير محدد'}</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Phone className="h-4 w-4" />
                رقم الجوال
              </div>
              <p className="font-medium" dir="ltr">{user.phone || '-'}</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Globe className="h-4 w-4" />
                الجنسية
              </div>
              <p className="font-medium">{user.nationality || '-'}</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                تاريخ التسجيل
              </div>
              <p className="font-medium">
                {format(new Date(user.created_at), 'dd MMMM yyyy', { locale: ar })}
              </p>
            </div>
          </div>

          {/* Roles */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Shield className="h-4 w-4" />
              الصلاحيات الممنوحة
            </div>
            <div className="flex flex-wrap gap-2">
              {user.roles.length > 0 ? (
                user.roles.map((role) => (
                  <Badge key={role} variant={ROLE_LABELS[role].variant}>
                    {ROLE_LABELS[role].label}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">لا توجد صلاحيات</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <FileText className="h-4 w-4" />
              إحصائيات
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{applicationCount}</p>
                    <p className="text-xs text-muted-foreground">طلبات التأشيرة</p>
                  </>
                )}
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{user.roles.length}</p>
                <p className="text-xs text-muted-foreground">صلاحيات</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
