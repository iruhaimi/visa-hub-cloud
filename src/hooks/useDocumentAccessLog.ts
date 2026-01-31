import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AccessType = 'view' | 'download' | 'update';

export function useDocumentAccessLog() {
  const { user, profile } = useAuth();

  const logDocumentAccess = useCallback(async (
    documentId: string,
    applicationId: string,
    accessType: AccessType,
    documentType?: string
  ) => {
    if (!user) return;

    try {
      await supabase
        .from('document_access_log')
        .insert({
          document_id: documentId,
          application_id: applicationId,
          accessed_by: user.id,
          accessed_by_name: profile?.full_name || null,
          access_type: accessType,
          document_type: documentType || null,
          user_agent: navigator.userAgent
        });
    } catch (error) {
      // Silent fail - don't block user action for logging
      console.error('Failed to log document access:', error);
    }
  }, [user, profile]);

  return { logDocumentAccess };
}
