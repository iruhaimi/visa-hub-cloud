import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { StaffPermission } from '@/types/database';

interface UsePermissionsReturn {
  permissions: StaffPermission[];
  loading: boolean;
  hasPermission: (permission: StaffPermission) => boolean;
  isSuperAdmin: boolean;
  refetch: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const { user, isAdmin, isAgent } = useAuth();
  const [permissions, setPermissions] = useState<StaffPermission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    if (!user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    // Only fetch permissions for staff (admin or agent)
    if (!isAdmin && !isAgent) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('staff_permissions')
        .select('permission')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching permissions:', error);
        setPermissions([]);
      } else {
        setPermissions((data || []).map((p) => p.permission as StaffPermission));
      }
    } catch (error) {
      console.error('Error in fetchPermissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [user, isAdmin, isAgent]);

  const isSuperAdmin = permissions.includes('manage_staff');

  const hasPermission = (permission: StaffPermission): boolean => {
    // Super admins have all permissions
    if (isSuperAdmin) return true;
    return permissions.includes(permission);
  };

  return {
    permissions,
    loading,
    hasPermission,
    isSuperAdmin,
    refetch: fetchPermissions,
  };
}
