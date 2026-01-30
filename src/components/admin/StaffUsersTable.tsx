import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { User as UserIcon, Shield, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
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

interface StaffUsersTableProps {
  users: UserWithRole[];
  onViewDetails: (user: UserWithRole) => void;
  onEdit: (user: UserWithRole) => void;
  onAddRole: (user: UserWithRole) => void;
  onDeleteRoles: (user: UserWithRole) => void;
  onRemoveRole: (userId: string, role: AppRole) => void;
  isAdmin: boolean;
}

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

export function StaffUsersTable({
  users,
  onViewDetails,
  onEdit,
  onAddRole,
  onDeleteRoles,
  onRemoveRole,
  isAdmin,
}: StaffUsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        لا يوجد موظفين مطابقين للبحث
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">الموظف</TableHead>
            <TableHead className="text-right">رقم الجوال</TableHead>
            <TableHead className="text-right">الجنسية</TableHead>
            <TableHead className="text-right">تاريخ التسجيل</TableHead>
            <TableHead className="text-right">الصلاحيات</TableHead>
            <TableHead className="text-right w-[100px]">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((userItem) => (
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
                      isAdmin ? (
                        <button
                          key={role}
                          onClick={() => onRemoveRole(userItem.user_id, role)}
                          className="transition-transform hover:scale-105"
                          title="اضغط لحذف الصلاحية"
                        >
                          {getRoleBadge(role)}
                        </button>
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
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onViewDetails(userItem)}>
                      <Eye className="h-4 w-4 ml-2" />
                      عرض التفاصيل
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuItem onClick={() => onEdit(userItem)}>
                          <Pencil className="h-4 w-4 ml-2" />
                          تعديل البيانات
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddRole(userItem)}>
                          <Shield className="h-4 w-4 ml-2" />
                          إضافة صلاحية
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDeleteRoles(userItem)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 ml-2" />
                          إلغاء الصلاحيات
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
  );
}
