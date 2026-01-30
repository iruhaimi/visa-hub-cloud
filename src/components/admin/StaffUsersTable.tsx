import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { User as UserIcon, Shield, MoreHorizontal, UserCog, Trash2, UserX, Mail, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  email?: string;
}

interface StaffUsersTableProps {
  users: UserWithRole[];
  onViewProfile: (user: UserWithRole) => void;
  onAddRole: (user: UserWithRole) => void;
  onDeleteRoles: (user: UserWithRole) => void;
  onRemoveRole: (userId: string, role: AppRole) => void;
  onDeleteStaff: (user: UserWithRole) => void;
  isAdmin: boolean;
}

const getRoleBadge = (role: AppRole) => {
  const config: Record<AppRole, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    customer: { label: 'عميل', variant: 'secondary' },
    agent: { label: 'وكيل', variant: 'default' },
    admin: { label: 'مشرف', variant: 'destructive' },
  };
  return (
    <Badge variant={config[role].variant} className="text-xs px-2 py-0.5">
      {config[role].label}
    </Badge>
  );
};

export function StaffUsersTable({
  users,
  onViewProfile,
  onAddRole,
  onDeleteRoles,
  onRemoveRole,
  onDeleteStaff,
  isAdmin,
}: StaffUsersTableProps) {
  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success('تم نسخ البريد الإلكتروني');
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <UserIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>لا يوجد موظفين مطابقين للبحث</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-right font-semibold">الموظف</TableHead>
              <TableHead className="text-right font-semibold">البريد الإلكتروني</TableHead>
              <TableHead className="text-right font-semibold">رقم الجوال</TableHead>
              <TableHead className="text-right font-semibold">تاريخ التسجيل</TableHead>
              <TableHead className="text-right font-semibold">الصلاحيات</TableHead>
              <TableHead className="text-right w-[80px] font-semibold">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((userItem) => (
              <TableRow key={userItem.id} className="group hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => onViewProfile(userItem)}
                      className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center hover:from-primary/30 hover:to-primary/15 transition-all duration-200 cursor-pointer shadow-sm"
                      title="عرض الملف الشخصي"
                    >
                      <UserIcon className="h-5 w-5 text-primary" />
                    </button>
                    <div className="min-w-0">
                      <button 
                        onClick={() => onViewProfile(userItem)}
                        className="font-medium hover:text-primary transition-colors cursor-pointer text-right block truncate max-w-[150px]"
                      >
                        {userItem.full_name || 'غير محدد'}
                      </button>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {userItem.roles.map((role) => (
                          <span 
                            key={role} 
                            className={`w-2 h-2 rounded-full ${
                              role === 'admin' ? 'bg-destructive' : 
                              role === 'agent' ? 'bg-primary' : 'bg-muted-foreground'
                            }`}
                            title={role === 'admin' ? 'مشرف' : role === 'agent' ? 'وكيل' : 'عميل'}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {userItem.email ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2 py-1 max-w-[180px]">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate" dir="ltr" title={userItem.email}>
                          {userItem.email}
                        </span>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyEmail(userItem.email!)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>نسخ البريد</TooltipContent>
                      </Tooltip>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span dir="ltr" className="text-sm">{userItem.phone || '-'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(userItem.created_at), 'dd MMM yyyy', { locale: ar })}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {userItem.roles.length > 0 ? (
                      userItem.roles.map((role) => (
                        isAdmin ? (
                          <Tooltip key={role}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => onRemoveRole(userItem.user_id, role)}
                                className="transition-all hover:scale-105 hover:opacity-80"
                              >
                                {getRoleBadge(role)}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>اضغط لحذف الصلاحية</TooltipContent>
                          </Tooltip>
                        ) : (
                          <span key={role}>{getRoleBadge(role)}</span>
                        )
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">لا توجد</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onViewProfile(userItem)}>
                        <UserCog className="h-4 w-4 ml-2" />
                        عرض وتعديل الملف
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuItem onClick={() => onAddRole(userItem)}>
                            <Shield className="h-4 w-4 ml-2" />
                            إضافة صلاحية
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDeleteRoles(userItem)}
                            className="text-amber-600 focus:text-amber-600 focus:bg-accent"
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            إلغاء الصلاحيات
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDeleteStaff(userItem)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <UserX className="h-4 w-4 ml-2" />
                            حذف الحساب نهائياً
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
