import { supabase } from '@/integrations/supabase/client';

interface SendAssignmentEmailParams {
  agentProfileId: string;
  agentName?: string;
  countryName?: string;
  visaType?: string;
  applicantName?: string;
  applicationId?: string;
}

export async function sendAssignmentEmail({
  agentProfileId,
  agentName,
  countryName,
  visaType,
  applicantName,
  applicationId,
}: SendAssignmentEmailParams) {
  try {
    // Get agent's user_id from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', agentProfileId)
      .single();

    if (!profile?.user_id) return;

    // Get agent email via RPC
    const { data: email } = await supabase.rpc('get_user_email', {
      target_user_id: profile.user_id,
    });

    if (!email) return;

    // Send transactional email
    await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'task-assignment',
        recipientEmail: email,
        idempotencyKey: `task-assign-${applicationId}-${agentProfileId}`,
        templateData: {
          agentName: agentName || 'الموظف/ة',
          countryName,
          visaType,
          applicantName,
          applicationId,
        },
      },
    });
  } catch (error) {
    console.error('Failed to send assignment email:', error);
    // Non-blocking - don't throw
  }
}
