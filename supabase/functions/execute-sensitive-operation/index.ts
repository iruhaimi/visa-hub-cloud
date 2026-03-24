import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify caller identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user: callingUser }, error: userError } = await userClient.auth.getUser()
    if (userError || !callingUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Verify caller is super admin
    const { data: isSuperAdmin } = await adminClient.rpc('has_permission', {
      _user_id: callingUser.id,
      _permission: 'manage_staff'
    })

    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Only super admins can execute sensitive operations' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { operationId } = await req.json()

    if (!operationId) {
      return new Response(
        JSON.stringify({ success: false, error: 'operationId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch the operation
    const { data: operation, error: fetchError } = await adminClient
      .from('pending_sensitive_operations')
      .select('*')
      .eq('id', operationId)
      .single()

    if (fetchError || !operation) {
      return new Response(
        JSON.stringify({ success: false, error: 'Operation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prevent self-approval
    if (operation.requested_by === callingUser.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot approve your own operation' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check operation is still pending and not expired
    if (operation.status !== 'pending') {
      return new Response(
        JSON.stringify({ success: false, error: 'Operation is no longer pending' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (new Date(operation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Operation has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark as approved (atomically with FOR UPDATE would be ideal, but use optimistic approach)
    const { error: updateError } = await adminClient
      .from('pending_sensitive_operations')
      .update({
        status: 'approved',
        approved_by: callingUser.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', operationId)
      .eq('status', 'pending') // Optimistic concurrency control

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to approve operation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Execute the operation using service_role
    let executionError: string | null = null

    switch (operation.operation_type) {
      case 'delete_staff': {
        const { error } = await adminClient.functions.invoke('delete-staff-user', {
          body: { user_id: operation.target_user_id }
        })
        if (error) executionError = `Failed to delete staff: ${error.message}`
        break
      }

      case 'remove_admin_role': {
        const { error } = await adminClient
          .from('user_roles')
          .delete()
          .eq('user_id', operation.target_user_id)
          .eq('role', 'admin')
        if (error) executionError = `Failed to remove admin role: ${error.message}`
        break
      }

      case 'remove_manage_staff_permission': {
        const { error } = await adminClient
          .from('staff_permissions')
          .delete()
          .eq('user_id', operation.target_user_id)
          .eq('permission', 'manage_staff')
        if (error) executionError = `Failed to remove permission: ${error.message}`
        break
      }

      default:
        executionError = `Unknown operation type: ${operation.operation_type}`
    }

    if (executionError) {
      // Rollback approval
      await adminClient
        .from('pending_sensitive_operations')
        .update({ status: 'pending', approved_by: null, approved_at: null })
        .eq('id', operationId)

      return new Response(
        JSON.stringify({ success: false, error: executionError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Operation approved and executed successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
