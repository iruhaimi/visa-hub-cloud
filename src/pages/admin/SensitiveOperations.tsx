import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  RefreshCw,
  Download,
  Trash2,
  Database,
  FileArchive,
  Plus,
  Eye,
  UserMinus,
  ShieldMinus
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useSensitiveOperations } from '@/hooks/useSensitiveOperations';
import { useSystemBackups } from '@/hooks/useSystemBackups';
import { useAuth } from '@/contexts/AuthContext';
import { 
  OPERATION_TYPE_LABELS, 
  APPROVAL_STATUS_LABELS,
  type PendingSensitiveOperation,
  type SystemBackup 
} from '@/types/sensitiveOperations';

export default function SensitiveOperations() {
  const { user } = useAuth();
  const { 
    operations, 
    loading: opsLoading, 
    pendingCount,
    refetch: refetchOps,
    approveOperation,
    rejectOperation 
  } = useSensitiveOperations();

  const {
    backups,
    loading: backupsLoading,
    creating: creatingBackup,
    refetch: refetchBackups,
    createBackup,
    downloadBackup,
    deleteBackup
  } = useSystemBackups();

  // Dialogs state
  const [selectedOp, setSelectedOp] = useState<PendingSensitiveOperation | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [backupNotes, setBackupNotes] = useState('');
  const [selectedBackup, setSelectedBackup] = useState<SystemBackup | null>(null);
  const [showDeleteBackupDialog, setShowDeleteBackupDialog] = useState(false);

  const handleApprove = async () => {
    if (!selectedOp) return;
    setProcessing(true);
    await approveOperation(selectedOp.id);
    setProcessing(false);
    setShowApproveDialog(false);
    setSelectedOp(null);
  };

  const handleReject = async () => {
    if (!selectedOp || !rejectReason.trim()) return;
    setProcessing(true);
    await rejectOperation(selectedOp.id, rejectReason);
    setProcessing(false);
    setShowRejectDialog(false);
    setSelectedOp(null);
    setRejectReason('');
  };

  const handleCreateBackup = async () => {
    await createBackup(backupNotes || undefined);
    setShowBackupDialog(false);
    setBackupNotes('');
  };

  const handleDeleteBackup = async () => {
    if (!selectedBackup) return;
    await deleteBackup(selectedBackup.id);
    setShowDeleteBackupDialog(false);
    setSelectedBackup(null);
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'delete_staff': return <Trash2 className="h-4 w-4" />;
      case 'remove_admin_role': return <ShieldMinus className="h-4 w-4" />;
      case 'remove_manage_staff_permission': return <UserMinus className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const canApprove = (op: PendingSensitiveOperation) => {
    return op.status === 'pending' && op.requested_by !== user?.id;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-destructive" />
            العمليات الحساسة والنسخ الاحتياطي
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة العمليات التي تتطلب موافقة ثنائية والنسخ الاحتياطية
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="gap-1 text-sm px-3 py-1">
            <AlertTriangle className="h-4 w-4" />
            {pendingCount} عملية تنتظر الموافقة
          </Badge>
        )}
      </div>

      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="operations" className="gap-2">
            <Shield className="h-4 w-4" />
            العمليات الحساسة
            {pendingCount > 0 && (
              <Badge variant="destructive" className="mr-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="backups" className="gap-2">
            <Database className="h-4 w-4" />
            النسخ الاحتياطي
          </TabsTrigger>
        </TabsList>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>طلبات العمليات الحساسة</CardTitle>
                <CardDescription>
                  العمليات التي تحتاج موافقة مدير عام آخر قبل التنفيذ
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={refetchOps} disabled={opsLoading}>
                <RefreshCw className={`h-4 w-4 ml-2 ${opsLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </CardHeader>
            <CardContent>
              {opsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : operations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>لا توجد عمليات حساسة</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نوع العملية</TableHead>
                      <TableHead>المستخدم المستهدف</TableHead>
                      <TableHead>طالب العملية</TableHead>
                      <TableHead>السبب</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operations.map((op) => (
                      <TableRow key={op.id} className={op.status === 'pending' ? 'bg-warning/5' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getOperationIcon(op.operation_type)}
                            <span className="font-medium">
                              {OPERATION_TYPE_LABELS[op.operation_type]?.label || op.operation_type}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{op.target_user_name}</TableCell>
                        <TableCell>{op.requester_name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {op.request_reason || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={APPROVAL_STATUS_LABELS[op.status]?.color || ''}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(op.status)}
                              {APPROVAL_STATUS_LABELS[op.status]?.label || op.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDistanceToNow(new Date(op.created_at), { addSuffix: true, locale: ar })}
                        </TableCell>
                        <TableCell>
                          {canApprove(op) ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-success hover:bg-success/90 h-8"
                                onClick={() => {
                                  setSelectedOp(op);
                                  setShowApproveDialog(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 ml-1" />
                                موافقة
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8"
                                onClick={() => {
                                  setSelectedOp(op);
                                  setShowRejectDialog(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 ml-1" />
                                رفض
                              </Button>
                            </div>
                          ) : op.status === 'pending' && op.requested_by === user?.id ? (
                            <span className="text-xs text-muted-foreground">بانتظار موافقة آخر</span>
                          ) : op.status === 'approved' ? (
                            <span className="text-xs text-success">تمت بواسطة {op.approver_name}</span>
                          ) : op.status === 'rejected' ? (
                            <span className="text-xs text-destructive" title={op.rejection_reason || ''}>
                              مرفوض: {op.rejection_reason?.substring(0, 20)}...
                            </span>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backups Tab */}
        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>النسخ الاحتياطية</CardTitle>
                <CardDescription>
                  إنشاء وتحميل واستعادة نسخ احتياطية من بيانات النظام
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={refetchBackups} disabled={backupsLoading}>
                  <RefreshCw className={`h-4 w-4 ml-2 ${backupsLoading ? 'animate-spin' : ''}`} />
                  تحديث
                </Button>
                <Button size="sm" onClick={() => setShowBackupDialog(true)} disabled={creatingBackup}>
                  {creatingBackup ? (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 ml-2" />
                  )}
                  نسخة جديدة
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {backupsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>لا توجد نسخ احتياطية</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowBackupDialog(true)}
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إنشاء نسخة احتياطية
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الملف</TableHead>
                      <TableHead>الحجم</TableHead>
                      <TableHead>الجداول</TableHead>
                      <TableHead>السجلات</TableHead>
                      <TableHead>بواسطة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileArchive className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-sm">{backup.file_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {backup.file_size 
                            ? `${(backup.file_size / 1024 / 1024).toFixed(2)} MB`
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{backup.tables_included.length} جدول</Badge>
                        </TableCell>
                        <TableCell>
                          {Object.values(backup.records_count).reduce((a, b) => a + b, 0)} سجل
                        </TableCell>
                        <TableCell>{backup.creator_name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(backup.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={() => downloadBackup(backup)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setShowDeleteBackupDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              تأكيد الموافقة على العملية
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right space-y-2">
              <p>هل أنت متأكد من الموافقة على هذه العملية الحساسة؟</p>
              {selectedOp && (
                <div className="bg-muted/50 rounded-lg p-3 mt-3 space-y-2">
                  <p><strong>نوع العملية:</strong> {OPERATION_TYPE_LABELS[selectedOp.operation_type]?.label}</p>
                  <p><strong>المستخدم المستهدف:</strong> {selectedOp.target_user_name}</p>
                  <p><strong>طالب العملية:</strong> {selectedOp.requester_name}</p>
                  {selectedOp.request_reason && (
                    <p><strong>السبب:</strong> {selectedOp.request_reason}</p>
                  )}
                </div>
              )}
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mt-3">
                <p className="text-warning text-sm">
                  ⚠️ هذا الإجراء لا يمكن التراجع عنه بعد الموافقة!
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={processing}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-success hover:bg-success/90"
              disabled={processing}
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              <CheckCircle className="h-4 w-4 ml-2" />
              تأكيد الموافقة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              رفض العملية
            </DialogTitle>
            <DialogDescription>
              يرجى تقديم سبب الرفض
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="سبب الرفض..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={processing}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectReason.trim()}
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              <XCircle className="h-4 w-4 ml-2" />
              رفض العملية
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Backup Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              إنشاء نسخة احتياطية
            </DialogTitle>
            <DialogDescription>
              سيتم إنشاء نسخة احتياطية من جميع بيانات النظام
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">ملاحظات (اختياري)</label>
              <Textarea
                placeholder="أضف ملاحظات للنسخة الاحتياطية..."
                value={backupNotes}
                onChange={(e) => setBackupNotes(e.target.value)}
                rows={2}
              />
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground mb-2">الجداول المشمولة:</p>
              <div className="flex flex-wrap gap-1">
                {['applications', 'profiles', 'payments', 'user_roles', 'staff_permissions'].map(table => (
                  <Badge key={table} variant="outline" className="text-xs">{table}</Badge>
                ))}
                <Badge variant="outline" className="text-xs">+5 أخرى</Badge>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowBackupDialog(false)} disabled={creatingBackup}>
              إلغاء
            </Button>
            <Button onClick={handleCreateBackup} disabled={creatingBackup}>
              {creatingBackup && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              <Database className="h-4 w-4 ml-2" />
              إنشاء النسخة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Backup Dialog */}
      <AlertDialog open={showDeleteBackupDialog} onOpenChange={setShowDeleteBackupDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              حذف النسخة الاحتياطية
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه النسخة الاحتياطية نهائياً؟
              <br />
              <strong>{selectedBackup?.file_name}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBackup}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
