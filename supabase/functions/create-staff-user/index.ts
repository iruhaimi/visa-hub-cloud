import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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
        JSON.stringify({ success: false, error: 'Only admins can create staff users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { email, password, full_name, phone, role } = await req.json()

    // Validate required fields
    if (!email || !password || !role) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email, password, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate role
    if (!['admin', 'agent'].includes(role)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid role. Must be admin or agent' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the user using admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for staff
      user_metadata: { full_name }
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return new Response(
        JSON.stringify({ success: false, error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update profile with phone if provided
    if (phone && newUser.user) {
      await adminClient
        .from('profiles')
        .update({ phone })
        .eq('user_id', newUser.user.id)
    }

    // Add the staff role (the trigger already adds 'customer' role)
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({
        user_id: newUser.user!.id,
        role: role
      })

    if (roleError) {
      console.error('Error adding role:', roleError)
      // User was created but role failed - still return success with warning
    }

    // Log the activity
    await adminClient
      .from('role_activity_log')
      .insert({
        target_user_id: newUser.user!.id,
        performed_by: callingUser.id,
        action: 'create_staff',
        role: role
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Staff user created successfully',
        user: {
          id: newUser.user!.id,
          email: newUser.user!.email
        }
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
