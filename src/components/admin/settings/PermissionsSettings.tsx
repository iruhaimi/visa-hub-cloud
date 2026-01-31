import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown, FileText, Users, Settings, Percent, Globe, Layout, BarChart3, RefreshCcw, Unlock, User, UserCog } from 'lucide-react';
import { PERMISSION_LABELS, ALL_PERMISSIONS, type StaffPermission } from '@/types/database';

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

// Default permissions for each role
const ROLE_PERMISSIONS: Record<string, { name: string; description: string; icon: React.ComponentType<{ className?: string }>; permissions: StaffPermission[] }> = {
  customer: {
    name: 'العميل',
    description: 'المستخدم العادي الذي يقدم طلبات التأشيرة',
    icon: User,
    permissions: [], // No admin permissions
  },
  agent: {
    name: 'الوكيل',
    description: 'موظف يتابع طلبات التأشيرة المسندة إليه',
    icon: UserCog,
    permissions: ['manage_applications'],
  },
  admin: {
    name: 'المشرف',
    description: 'مشرف بصلاحيات محدودة حسب التخصيص',
    icon: Shield,
    permissions: ['manage_applications', 'manage_users', 'view_reports'],
  },
  super_admin: {
    name: 'المدير العام',
    description: 'يملك كامل الصلاحيات على النظام بما في ذلك إدارة الموظفين',
    icon: Crown,
    permissions: [...ALL_PERMISSIONS],
  },
};

export function PermissionsSettings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">نظام الصلاحيات</h2>
          <p className="text-muted-foreground text-sm">
            الصلاحيات الافتراضية لكل دور في النظام
          </p>
        </div>
      </div>

      {/* Role Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(ROLE_PERMISSIONS).map(([roleKey, role]) => (
          <Card key={roleKey} className={roleKey === 'super_admin' ? 'border-destructive/30 bg-destructive/5' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  roleKey === 'super_admin' 
                    ? 'bg-destructive/10 text-destructive' 
                    : roleKey === 'admin'
                    ? 'bg-primary/10 text-primary'
                    : roleKey === 'agent'
                    ? 'bg-blue-500/10 text-blue-600'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <role.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {role.name}
                    {roleKey === 'super_admin' && (
                      <Badge variant="destructive" className="text-xs">كامل الصلاحيات</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {role.permissions.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  لا يملك صلاحيات إدارية
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((permission) => {
                    const config = PERMISSION_LABELS[permission];
                    const IconComponent = IconMap[config.icon] || Shield;
                    return (
                      <Badge 
                        key={permission} 
                        variant="secondary"
                        className="gap-1 text-xs"
                      >
                        <IconComponent className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All Permissions Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            قائمة الصلاحيات المتاحة
          </CardTitle>
          <CardDescription>
            جميع الصلاحيات التي يمكن تخصيصها للموظفين
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {ALL_PERMISSIONS.map((permission) => {
              const config = PERMISSION_LABELS[permission];
              const IconComponent = IconMap[config.icon] || Shield;
              const isManageStaff = permission === 'manage_staff';
              
              return (
                <div 
                  key={permission}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    isManageStaff ? 'border-destructive/30 bg-destructive/5' : ''
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${
                    isManageStaff 
                      ? 'bg-destructive/10 text-destructive' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium text-sm flex items-center gap-1 ${
                      isManageStaff ? 'text-destructive' : ''
                    }`}>
                      {config.label}
                      {isManageStaff && <Crown className="h-3 w-3" />}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Security Note */}
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-warning mt-0.5" />
          <div>
            <h4 className="font-medium text-warning">ملاحظة أمنية</h4>
            <p className="text-sm text-muted-foreground mt-1">
              صلاحية "إدارة الموظفين" تمنح المستخدم كامل الصلاحيات على النظام كمدير عام. 
              يُنصح بمنحها فقط للموظفين الموثوقين.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
