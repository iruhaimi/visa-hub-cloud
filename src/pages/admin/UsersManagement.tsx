import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  Search,
  Shield,
  User as UserIcon,
  Loader2,
  RefreshCw,
  History,
  Plus,
  Minus,
  Download,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  UserCheck,
  Users,
  UserCog
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { UserEditDialog } from '@/components/admin/UserEditDialog';
import { UserDetailsDialog } from '@/components/admin/UserDetailsDialog';
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

const ROLE_OPTIONS: { value: AppRole; label: string; description: string }[] = [
  { value: 'customer', label: 'عميل', description: 'صلاحيات التقديم على التأشيرات' },
  { value: 'agent', label: 'وكيل', description: 'مراجعة الطلبات المُعيّنة' },
  { value: 'admin', label: 'مشرف', description: 'صلاحيات كاملة على النظام' },
];

export default function UsersManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [loadingLog, setLoadingLog] = useState(false);
  
  // Dialogs
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newRole, setNewRole] = useState<AppRole | ''>('');
  const [updating, setUpdating] = useState(false);
  
  // Activity log filters
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logDateFrom, setLogDateFrom] = useState('');
  const [logDateTo, setLogDateTo] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      setShowRoleDialog(false);
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
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.phone?.includes(searchQuery) ||
        user.nationality?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    // Role filter
    if (roleFilter !== 'all') {
      if (!user.roles.includes(roleFilter as AppRole)) return false;
    }
    
    return true;
  });

  // Stats
  const stats = {
    total: users.length,
    admins: users.filter(u => u.roles.includes('admin')).length,
    agents: users.filter(u => u.roles.includes('agent')).length,
    customers: users.filter(u => u.roles.includes('customer')).length,
  };

  const getRoleBadge = (role: AppRole) => {
    const config: Record<AppRole, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      customer: { label: 'عميل', variant: 'secondary' },
      agent: { label: 'وكيل', variant: 'default' },
      admin: { label: 'مشرف', variant: 'destructive' },
    };
    return (
      <Badge variant={config[role].variant} className="text-xs">
        {config[role].label}
      </Badge>
    );
  };

  // Export users to Excel
  const exportUsersToExcel = () => {
    const exportData = filteredUsers.map(user => ({
      'الاسم': user.full_name || 'غير محدد',
      'رقم الجوال': user.phone || '-',
      'الجنسية': user.nationality || '-',
      'تاريخ التسجيل': format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ar }),
      'الصلاحيات': user.roles.map(r => ROLE_OPTIONS.find(o => o.value === r)?.label).join(', '),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المستخدمين');
    
    ws['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
    ];
    
    XLSX.writeFile(wb, `المستخدمين_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('تم تصدير قائمة المستخدمين بنجاح');
  };

  // Open dialogs
  const openRoleDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setNewRole('');
    setShowRoleDialog(true);
  };

  const openEditDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const openDetailsDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  };

  const openDeleteDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleDeleteAllRoles = async () => {
    if (!selectedUser) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      toast.success('تم إلغاء جميع صلاحيات المستخدم');
      setShowDeleteDialog(false);
      setSelectedUser(null);
      fetchUsers();
      fetchActivityLog();
    } catch (error) {
      console.error('Error deleting roles:', error);
      toast.error('حدث خطأ في إلغاء الصلاحيات');
    } finally {
      setUpdating(false);
    }
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

  // Filter activity log
  const filteredActivityLog = activityLog.filter(log => {
    // Search filter
    if (logSearchQuery) {
      const searchLower = logSearchQuery.toLowerCase();
      const matchesTarget = log.target_user_name?.toLowerCase().includes(searchLower);
      const matchesPerformer = log.performer_name?.toLowerCase().includes(searchLower);
      if (!matchesTarget && !matchesPerformer) return false;
    }
    
    // Date from filter
    if (logDateFrom) {
      const logDate = new Date(log.created_at);
      const fromDate = new Date(logDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (logDate < fromDate) return false;
    }
    
    // Date to filter
    if (logDateTo) {
      const logDate = new Date(log.created_at);
      const toDate = new Date(logDateTo);
      toDate.setHours(23, 59, 59, 999);
      if (logDate > toDate) return false;
    }
    
    return true;
  });

  // Export activity log to Excel
  const exportActivityLogToExcel = () => {
    const exportData = filteredActivityLog.map(log => ({
      'التاريخ والوقت': format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ar }),
      'الإجراء': getActionLabel(log.action),
      'المستخدم المستهدف': log.target_user_name || 'غير معروف',
      'الصلاحية': ROLE_OPTIONS.find(r => r.value === log.role)?.label || log.role,
      'بواسطة': log.performer_name || 'غير معروف',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجل النشاطات');
    
    // Set RTL and column widths
    ws['!cols'] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 25 },
      { wch: 12 },
      { wch: 25 },
    ];
    
    XLSX.writeFile(wb, `سجل_النشاطات_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('تم تصدير سجل النشاطات بنجاح');
  };

  const clearLogFilters = () => {
    setLogSearchQuery('');
    setLogDateFrom('');
    setLogDateTo('');
    setCurrentPage(1);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredActivityLog.length / itemsPerPage);
  const paginatedActivityLog = filteredActivityLog.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [logSearchQuery, logDateFrom, logDateTo]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            إدارة المستخدمين
          </h2>
          <p className="text-muted-foreground">إدارة شاملة للمستخدمين وصلاحياتهم</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportUsersToExcel} variant="outline" size="sm">
            <Download className="h-4 w-4 ml-2" />
            تصدير Excel
          </Button>
          <Button onClick={() => { fetchUsers(); fetchActivityLog(); }} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">إجمالي المستخدمين</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.admins}</p>
                <p className="text-xs text-muted-foreground">المشرفين</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCog className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.agents}</p>
                <p className="text-xs text-muted-foreground">الوكلاء</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.customers}</p>
                <p className="text-xs text-muted-foreground">العملاء</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالاسم، رقم الجوال، أو الجنسية..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="فلتر بالصلاحية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الصلاحيات</SelectItem>
                    <SelectItem value="admin">المشرفين</SelectItem>
                    <SelectItem value="agent">الوكلاء</SelectItem>
                    <SelectItem value="customer">العملاء</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>المستخدمين ({filteredUsers.length})</span>
              </CardTitle>
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
                        <TableHead className="text-right w-[100px]">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((userItem) => (
                        <TableRow key={userItem.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{userItem.full_name || 'غير محدد'}</p>
                                <p className="text-xs text-muted-foreground">{userItem.user_id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell dir="ltr" className="text-right">{userItem.phone || '-'}</TableCell>
                          <TableCell>{userItem.nationality || '-'}</TableCell>
                          <TableCell>
                            {format(new Date(userItem.created_at), 'dd MMM yyyy', { locale: ar })}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {userItem.roles.length > 0 ? (
                                userItem.roles.map((role) => (
                                  <button
                                    key={role}
                                    onClick={() => handleRemoveRole(userItem.user_id, role)}
                                    className="transition-transform hover:scale-105"
                                    title="اضغط لحذف الصلاحية"
                                  >
                                    {getRoleBadge(role)}
                                  </button>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground">لا توجد</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => openDetailsDialog(userItem)}>
                                  <Eye className="h-4 w-4 ml-2" />
                                  عرض التفاصيل
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(userItem)}>
                                  <Pencil className="h-4 w-4 ml-2" />
                                  تعديل البيانات
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openRoleDialog(userItem)}>
                                  <Shield className="h-4 w-4 ml-2" />
                                  إضافة صلاحية
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(userItem)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 ml-2" />
                                  إلغاء الصلاحيات
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

        <TabsContent value="activity" className="space-y-4 mt-4">
          {/* Filters Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالاسم..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                
                {/* Date From */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    placeholder="من تاريخ"
                    value={logDateFrom}
                    onChange={(e) => setLogDateFrom(e.target.value)}
                    className="w-40"
                  />
                </div>
                
                {/* Date To */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">إلى</span>
                  <Input
                    type="date"
                    placeholder="إلى تاريخ"
                    value={logDateTo}
                    onChange={(e) => setLogDateTo(e.target.value)}
                    className="w-40"
                  />
                </div>
                
                {/* Clear Filters */}
                {(logSearchQuery || logDateFrom || logDateTo) && (
                  <Button variant="ghost" size="sm" onClick={clearLogFilters}>
                    <Filter className="h-4 w-4 ml-1" />
                    مسح الفلاتر
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                سجل تغييرات الصلاحيات ({filteredActivityLog.length})
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportActivityLogToExcel}
                disabled={filteredActivityLog.length === 0}
              >
                <Download className="h-4 w-4 ml-2" />
                تصدير Excel
              </Button>
            </CardHeader>
            <CardContent>
              {loadingLog ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredActivityLog.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {activityLog.length === 0 ? 'لا توجد نشاطات مسجلة بعد' : 'لا توجد نتائج مطابقة للبحث'}
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
                      {paginatedActivityLog.map((log) => (
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
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    عرض {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredActivityLog.length)} من {filteredActivityLog.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                      السابق
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className="w-9 h-9"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      التالي
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              إضافة صلاحية لـ {selectedUser?.full_name || 'المستخدم'}
            </DialogTitle>
            <DialogDescription>
              اختر الصلاحية التي تريد منحها لهذا المستخدم
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الصلاحية</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصلاحية" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.filter(r => !selectedUser?.roles.includes(r.value)).length > 0 ? (
                    ROLE_OPTIONS.filter(r => !selectedUser?.roles.includes(r.value)).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="py-2 px-3 text-sm text-muted-foreground">
                      لا توجد صلاحيات متاحة للإضافة
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Current roles */}
            {selectedUser && selectedUser.roles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">الصلاحيات الحالية</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.roles.map(role => getRoleBadge(role))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddRole} disabled={!newRole || updating}>
              {updating && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              إضافة الصلاحية
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <UserEditDialog
        user={selectedUser}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={fetchUsers}
      />

      {/* Details Dialog */}
      <UserDetailsDialog
        user={selectedUser}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              إلغاء جميع صلاحيات المستخدم
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إلغاء جميع صلاحيات المستخدم <strong>{selectedUser?.full_name}</strong>؟
              <br />
              سيفقد المستخدم جميع صلاحياته في النظام.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllRoles}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {updating && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              تأكيد الإلغاء
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
