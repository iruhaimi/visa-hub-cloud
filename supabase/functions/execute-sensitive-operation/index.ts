import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { corsHeaders } from '../_shared/cors.ts'

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

    // Identify the calling user
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

    // Verify caller is a super admin (has manage_staff permission)
    const { data: hasManageStaff } = await adminClient.rpc('has_permission', {
      _user_id: callingUser.id,
      _permission: 'manage_staff',
    })
    if (!hasManageStaff) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: super admin required' }),
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

    // CRIT-2: Server-side self-approval prevention
    if (operation.requested_by === callingUser.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot approve your own operation' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (operation.status !== 'pending') {
      return new Response(
        JSON.stringify({ success: false, error: 'Operation is no longer pending' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (new Date(operation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Operation has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Optimistic concurrency: mark as approved only if still pending
    const { error: updateError, count } = await adminClient
      .from('pending_sensitive_operations')
      .update({
        status: 'approved',
        approved_by: callingUser.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', operationId)
      .eq('status', 'pending') // guard against race condition
      .select()

    if (updateError || !count) {
      return new Response(
        JSON.stringify({ success: false, error: 'Operation could not be approved (already processed or expired)' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Execute the operation server-side (service_role bypasses RLS)
    let execError: string | null = null
    try {
      switch (operation.operation_type) {
        case 'delete_staff': {
          // NEW-2 FIX: Cannot call delete-staff-user via functions.invoke — that function
          // uses auth.getUser() to identify the caller, but adminClient sends the service_role
          // JWT which getUser() rejects (it is not a user token). Perform the deletion
          // directly here; adminClient already has service_role access.
          await adminClient.from('staff_permissions').delete().eq('user_id', operation.target_user_id)
          await adminClient.from('user_roles').delete().eq('user_id', operation.target_user_id)
          await adminClient.from('role_activity_log').insert({
            target_user_id: operation.target_user_id,
            performed_by: callingUser.id,
            action: 'delete_staff',
            role: 'admin',
          })
          const { error } = await adminClient.auth.admin.deleteUser(operation.target_user_id)
          if (error) throw error
          break
        }
        case 'remove_admin_role': {
          const { error } = await adminClient
            .from('user_roles')
            .delete()
            .eq('user_id', operation.target_user_id)
            .eq('role', 'admin')
          if (error) throw error
          break
        }
        case 'remove_manage_staff_permission': {
          const { error } = await adminClient
            .from('staff_permissions')
            .delete()
            .eq('user_id', operation.target_user_id)
            .eq('permission', 'manage_staff')
          if (error) throw error
          break
        }
        default:
          throw new Error(`Unknown operation type: ${operation.operation_type}`)
      }
    } catch (err: any) {
      execError = err?.message || 'Execution failed'
      // Roll back the approval status on execution failure
      await adminClient
        .from('pending_sensitive_operations')
        .update({ status: 'pending', approved_by: null, approved_at: null })
        .eq('id', operationId)
    }

    if (execError) {
      return new Response(
        JSON.stringify({ success: false, error: `Approval rolled back: ${execError}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
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
