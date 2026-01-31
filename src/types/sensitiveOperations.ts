export type SensitiveOperationType = 
  | 'delete_staff'
  | 'remove_admin_role'
  | 'remove_manage_staff_permission';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface PendingSensitiveOperation {
  id: string;
  operation_type: SensitiveOperationType;
  target_user_id: string;
  requested_by: string;
  request_reason: string | null;
  operation_data: Record<string, unknown>;
  status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  target_user_name?: string;
  requester_name?: string;
  approver_name?: string;
}

export interface SystemBackup {
  id: string;
  backup_type: 'manual' | 'scheduled';
  file_name: string;
  file_path: string;
  file_size: number | null;
  tables_included: string[];
  records_count: Record<string, number>;
  created_by: string;
  notes: string | null;
  created_at: string;
  // Joined fields
  creator_name?: string;
}

export const OPERATION_TYPE_LABELS: Record<SensitiveOperationType, { label: string; description: string; icon: string }> = {
  delete_staff: {
    label: 'حذف حساب موظف',
    description: 'حذف حساب موظف نهائياً من النظام',
    icon: 'Trash2'
  },
  remove_admin_role: {
    label: 'إزالة صلاحية مشرف',
    description: 'إزالة دور المشرف من مستخدم',
    icon: 'ShieldMinus'
  },
  remove_manage_staff_permission: {
    label: 'إزالة صلاحية إدارة الموظفين',
    description: 'إزالة صلاحية المدير العام من مستخدم',
    icon: 'UserMinus'
  }
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, { label: string; color: string }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-warning/10 text-warning' },
  approved: { label: 'تمت الموافقة', color: 'bg-success/10 text-success' },
  rejected: { label: 'مرفوض', color: 'bg-destructive/10 text-destructive' },
  expired: { label: 'منتهي الصلاحية', color: 'bg-muted text-muted-foreground' }
};
