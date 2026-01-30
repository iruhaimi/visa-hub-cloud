import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header to verify admin status
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with user's token to check admin status
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get the calling user
    const { data: { user: callingUser }, error: userError } = await userClient.auth.getUser()
    if (userError || !callingUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if calling user is admin using service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: isAdminResult } = await adminClient.rpc('is_admin', { _user_id: callingUser.id })
    
    if (!isAdminResult) {
      return new Response(
        JSON.stringify({ success: false, error: 'Only admins can delete staff users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { user_id } = await req.json()

    // Validate required fields
    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prevent self-deletion
    if (user_id === callingUser.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if target user is staff (has admin or agent role)
    const { data: targetRoles } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)

    const isStaff = targetRoles?.some(r => r.role === 'admin' || r.role === 'agent')
    if (!isStaff) {
      return new Response(
        JSON.stringify({ success: false, error: 'This user is not a staff member' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log the activity before deletion
    await adminClient
      .from('role_activity_log')
      .insert({
        target_user_id: user_id,
        performed_by: callingUser.id,
        action: 'delete_staff',
        role: 'admin' // We use admin as placeholder for full deletion
      })

    // Delete user roles first
    await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', user_id)

    // Delete user profile
    await adminClient
      .from('profiles')
      .delete()
      .eq('user_id', user_id)

    // Delete the user from auth using admin API
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return new Response(
        JSON.stringify({ success: false, error: deleteError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Staff user ${user_id} deleted successfully by admin ${callingUser.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Staff user deleted successfully'
      }),
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
