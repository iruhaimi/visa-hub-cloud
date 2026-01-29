import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search,
  Shield,
  User as UserIcon,
  Loader2,
  RefreshCw,
  History,
  Plus,
  Minus
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
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

interface ActivityLogEntry {
  id: string;
  target_user_id: string;
  performed_by: string;
  action: 'add_role' | 'remove_role';
  role: AppRole;
  created_at: string;
  target_user_name?: string;
  performer_name?: string;
}

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: 'customer', label: 'عميل' },
  { value: 'agent', label: 'وكيل' },
  { value: 'admin', label: 'مشرف' },
];

export default function UsersManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [loadingLog, setLoadingLog] = useState(false);
  
  // Role dialog
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<AppRole | ''>('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchActivityLog();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        roles: roles?.filter(r => r.user_id === profile.user_id).map(r => r.role) || [],
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('حدث خطأ في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLog = async () => {
    setLoadingLog(true);
    try {
      const { data: logs, error } = await supabase
        .from('role_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get unique user IDs
      const userIds = new Set<string>();
      logs?.forEach(log => {
        userIds.add(log.target_user_id);
        userIds.add(log.performed_by);
      });

      // Fetch user names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', Array.from(userIds));

      const userNameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      // Enhance logs with names
      const enhancedLogs: ActivityLogEntry[] = logs?.map(log => ({
        ...log,
        action: log.action as 'add_role' | 'remove_role',
        target_user_name: userNameMap.get(log.target_user_id) || 'مستخدم غير معروف',
        performer_name: userNameMap.get(log.performed_by) || 'مستخدم غير معروف',
      })) || [];

      setActivityLog(enhancedLogs);
    } catch (error) {
      console.error('Error fetching activity log:', error);
    } finally {
      setLoadingLog(false);
    }
  };

  const logActivity = async (targetUserId: string, action: 'add_role' | 'remove_role', role: AppRole) => {
    if (!user) return;
    
    try {
      await supabase.from('role_activity_log').insert({
        target_user_id: targetUserId,
        performed_by: user.id,
        action,
        role,
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const handleAddRole = async () => {
    if (!selectedUser || !newRole) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.user_id,
          role: newRole,
        });

      if (error) throw error;

      // Log the activity
      await logActivity(selectedUser.user_id, 'add_role', newRole);

      toast.success('تم إضافة الصلاحية بنجاح');
      setSelectedUser(null);
      setNewRole('');
      fetchUsers();
      fetchActivityLog();
    } catch (error: any) {
      console.error('Error adding role:', error);
      if (error.code === '23505') {
        toast.error('هذه الصلاحية موجودة مسبقاً');
      } else {
        toast.error('حدث خطأ في إضافة الصلاحية');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    if (!confirm('هل أنت متأكد من حذف هذه الصلاحية؟')) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      // Log the activity
      await logActivity(userId, 'remove_role', role);

      toast.success('تم حذف الصلاحية بنجاح');
      fetchUsers();
      fetchActivityLog();
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('حدث خطأ في حذف الصلاحية');
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.phone?.includes(searchQuery) ||
      user.nationality?.toLowerCase().includes(searchLower)
    );
  });

  const getRoleBadge = (role: AppRole) => {
    const config: Record<AppRole, { label: string; className: string }> = {
      customer: { label: 'عميل', className: 'bg-muted text-muted-foreground' },
      agent: { label: 'وكيل', className: 'bg-primary/10 text-primary' },
      admin: { label: 'مشرف', className: 'bg-destructive/10 text-destructive' },
    };
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config[role].className}`}>
        {config[role].label}
      </span>
    );
  };

  const getActionLabel = (action: 'add_role' | 'remove_role') => {
    return action === 'add_role' ? 'إضافة صلاحية' : 'حذف صلاحية';
  };

  const getActionIcon = (action: 'add_role' | 'remove_role') => {
    return action === 'add_role' ? (
      <Plus className="h-4 w-4 text-primary" />
    ) : (
      <Minus className="h-4 w-4 text-destructive" />
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة المستخدمين</h2>
          <p className="text-muted-foreground">عرض وإدارة صلاحيات المستخدمين</p>
        </div>
        <Button onClick={() => { fetchUsers(); fetchActivityLog(); }} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث
        </Button>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="users" className="gap-2">
            <UserIcon className="h-4 w-4" />
            المستخدمين
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <History className="h-4 w-4" />
            سجل النشاطات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم، رقم الجوال، أو الجنسية..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>المستخدمين ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  لا يوجد مستخدمين مطابقين للبحث
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المستخدم</TableHead>
                        <TableHead className="text-right">رقم الجوال</TableHead>
                        <TableHead className="text-right">الجنسية</TableHead>
                        <TableHead className="text-right">تاريخ التسجيل</TableHead>
                        <TableHead className="text-right">الصلاحيات</TableHead>
                        <TableHead className="text-right">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <span className="font-medium">{user.full_name || 'غير محدد'}</span>
                            </div>
                          </TableCell>
                          <TableCell>{user.phone || '-'}</TableCell>
                          <TableCell>{user.nationality || '-'}</TableCell>
                          <TableCell>
                            {format(new Date(user.created_at), 'dd MMM yyyy', { locale: ar })}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.roles.map((role) => (
                                <button
                                  key={role}
                                  onClick={() => handleRemoveRole(user.user_id, role)}
                                  className="group relative"
                                  title="اضغط للحذف"
                                >
                                  {getRoleBadge(role)}
                                </button>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Shield className="h-4 w-4 ml-1" />
                              إضافة صلاحية
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                سجل تغييرات الصلاحيات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLog ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : activityLog.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  لا توجد نشاطات مسجلة بعد
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">التاريخ والوقت</TableHead>
                        <TableHead className="text-right">الإجراء</TableHead>
                        <TableHead className="text-right">المستخدم المستهدف</TableHead>
                        <TableHead className="text-right">الصلاحية</TableHead>
                        <TableHead className="text-right">بواسطة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityLog.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(log.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getActionIcon(log.action)}
                              <span>{getActionLabel(log.action)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {log.target_user_name}
                          </TableCell>
                          <TableCell>
                            {getRoleBadge(log.role)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {log.performer_name}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Role Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة صلاحية لـ {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">الصلاحية</label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصلاحية" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.filter(r => !selectedUser?.roles.includes(r.value)).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              إلغاء
            </Button>
            <Button onClick={handleAddRole} disabled={!newRole || updating}>
              {updating && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
