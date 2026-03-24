import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PendingSensitiveOperation, SensitiveOperationType } from '@/types/sensitiveOperations';
import { toast } from 'sonner';

export function useSensitiveOperations() {
  const [operations, setOperations] = useState<PendingSensitiveOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchOperations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pending_sensitive_operations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user names for all related users
      const userIds = new Set<string>();
      data?.forEach(op => {
        userIds.add(op.target_user_id);
        userIds.add(op.requested_by);
        if (op.approved_by) userIds.add(op.approved_by);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', Array.from(userIds));

      const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      const enhanced: PendingSensitiveOperation[] = (data || []).map(op => ({
        ...op,
        operation_data: op.operation_data as Record<string, unknown>,
        target_user_name: nameMap.get(op.target_user_id) || 'غير معروف',
        requester_name: nameMap.get(op.requested_by) || 'غير معروف',
        approver_name: op.approved_by ? nameMap.get(op.approved_by) || 'غير معروف' : null,
      }));

      setOperations(enhanced);
      setPendingCount(enhanced.filter(op => op.status === 'pending').length);
    } catch (error) {
      console.error('Error fetching sensitive operations:', error);
      toast.error('خطأ في تحميل العمليات الحساسة');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  const createOperation = async (
    operationType: SensitiveOperationType,
    targetUserId: string,
    reason: string,
    operationData?: Record<string, unknown>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('غير مصرح');

      const insertData = {
        operation_type: operationType,
        target_user_id: targetUserId,
        requested_by: user.id,
        request_reason: reason,
        operation_data: operationData || {},
      };

      const { error } = await supabase
        .from('pending_sensitive_operations')
        .insert(insertData as any);

      if (error) throw error;

      toast.success('تم إنشاء طلب العملية الحساسة - في انتظار موافقة مدير عام آخر');
      fetchOperations();
      return true;
    } catch (error: any) {
      console.error('Error creating sensitive operation:', error);
      toast.error(error.message || 'خطأ في إنشاء العملية');
      return false;
    }
  };

  // CRIT-2: Approval and execution are now handled server-side via the
  // execute-sensitive-operation Edge Function which:
  //   1. Re-verifies the caller is a super admin (server-side)
  //   2. Prevents self-approval (server-side, can't be bypassed)
  //   3. Uses optimistic concurrency to prevent double-approval races
  //   4. Rolls back the approval status if execution fails
  const approveOperation = async (operationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('execute-sensitive-operation', {
        body: { operationId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('تمت الموافقة وتنفيذ العملية بنجاح');
      fetchOperations();
      return true;
    } catch (error: any) {
      console.error('Error approving operation:', error);
      toast.error(error.message || 'خطأ في الموافقة على العملية');
      return false;
    }
  };

  const rejectOperation = async (operationId: string, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('غير مصرح');

      const { error } = await supabase
        .from('pending_sensitive_operations')
        .update({
          status: 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', operationId);

      if (error) throw error;

      toast.success('تم رفض العملية');
      fetchOperations();
      return true;
    } catch (error: any) {
      console.error('Error rejecting operation:', error);
      toast.error(error.message || 'خطأ في رفض العملية');
      return false;
    }
  };

  return {
    operations,
    loading,
    pendingCount,
    refetch: fetchOperations,
    createOperation,
    approveOperation,
    rejectOperation,
  };
}
