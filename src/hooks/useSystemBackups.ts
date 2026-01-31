import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SystemBackup } from '@/types/sensitiveOperations';
import { toast } from 'sonner';
import JSZip from 'jszip';

const BACKUP_TABLES = [
  'applications',
  'application_documents',
  'application_notes',
  'application_status_history',
  'payments',
  'profiles',
  'user_roles',
  'staff_permissions',
  'role_activity_log',
  'pending_sensitive_operations',
];

export function useSystemBackups() {
  const [backups, setBackups] = useState<SystemBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_backups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get creator names
      const userIds = new Set<string>();
      data?.forEach(b => userIds.add(b.created_by));

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', Array.from(userIds));

      const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      const enhanced: SystemBackup[] = (data || []).map(b => ({
        ...b,
        backup_type: b.backup_type as 'manual' | 'scheduled',
        records_count: b.records_count as Record<string, number>,
        creator_name: nameMap.get(b.created_by) || 'غير معروف',
      }));

      setBackups(enhanced);
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast.error('خطأ في تحميل النسخ الاحتياطية');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const createBackup = async (notes?: string): Promise<boolean> => {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('غير مصرح');

      const zip = new JSZip();
      const recordsCounts: Record<string, number> = {};
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      // Export each table
      for (const table of BACKUP_TABLES) {
        const { data, error } = await supabase
          .from(table as any)
          .select('*');

        if (error) {
          console.warn(`Warning: Could not backup ${table}:`, error.message);
          continue;
        }

        recordsCounts[table] = data?.length || 0;
        zip.file(`${table}.json`, JSON.stringify(data || [], null, 2));
      }

      // Generate zip file
      const content = await zip.generateAsync({ type: 'blob' });
      const fileName = `backup_${timestamp}.zip`;

      // Upload to storage
      const filePath = `backups/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, content, {
          contentType: 'application/zip',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Save backup metadata
      const { error: insertError } = await supabase
        .from('system_backups')
        .insert({
          backup_type: 'manual',
          file_name: fileName,
          file_path: filePath,
          file_size: content.size,
          tables_included: BACKUP_TABLES,
          records_count: recordsCounts,
          created_by: user.id,
          notes,
        });

      if (insertError) throw insertError;

      // Also download locally
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('تم إنشاء النسخة الاحتياطية بنجاح');
      fetchBackups();
      return true;
    } catch (error: any) {
      console.error('Error creating backup:', error);
      toast.error(error.message || 'خطأ في إنشاء النسخة الاحتياطية');
      return false;
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = async (backup: SystemBackup) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(backup.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = backup.file_name;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('تم تحميل النسخة الاحتياطية');
    } catch (error: any) {
      console.error('Error downloading backup:', error);
      toast.error(error.message || 'خطأ في تحميل النسخة الاحتياطية');
    }
  };

  const deleteBackup = async (backupId: string) => {
    try {
      const backup = backups.find(b => b.id === backupId);
      if (!backup) return false;

      // Delete from storage
      await supabase.storage
        .from('documents')
        .remove([backup.file_path]);

      // Delete metadata
      const { error } = await supabase
        .from('system_backups')
        .delete()
        .eq('id', backupId);

      if (error) throw error;

      toast.success('تم حذف النسخة الاحتياطية');
      fetchBackups();
      return true;
    } catch (error: any) {
      console.error('Error deleting backup:', error);
      toast.error(error.message || 'خطأ في حذف النسخة الاحتياطية');
      return false;
    }
  };

  return {
    backups,
    loading,
    creating,
    refetch: fetchBackups,
    createBackup,
    downloadBackup,
    deleteBackup,
  };
}
