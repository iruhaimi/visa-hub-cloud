import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Send2FARequest {
  email: string;
  phone?: string;
  userId: string;
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============================================================
    // AUTHENTICATION: Verify the caller is authenticated
    // ============================================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify JWT using the caller's token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callingUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !callingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, phone, userId }: Send2FARequest = await req.json();

    // Validate required fields
    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email and userId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify that the calling user matches the requested userId
    if (callingUser.id !== userId) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the user is staff (admin or agent)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: isStaff } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    const { data: isAgent } = await supabase.rpc("has_role", { _user_id: userId, _role: "agent" });

    if (!isStaff && !isAgent) {
      return new Response(
        JSON.stringify({ error: "Forbidden - staff only" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check rate limit
    const { data: canProceed } = await supabase.rpc("check_2fa_rate_limit", { check_user_id: userId });
    if (!canProceed) {
      return new Response(
        JSON.stringify({ error: "Too many attempts. Please wait before requesting another code." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.log(`Processing 2FA for: ${email}`);

    // Hash the code before storing
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const codeHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Insert hashed 2FA code
    const { error: insertError } = await supabase.from("staff_2fa_codes").insert({
      user_id: userId,
      email: email,
      code: codeHash,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("Failed to insert 2FA code:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create verification code" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ============================================================
    // EMAIL SENDING via Lovable transactional email system
    // ============================================================
    let emailSent = false;

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 30px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="margin-bottom: 20px;">
              <div style="background-color: #2563eb; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 30px;">🔐</span>
              </div>
            </div>
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 10px;">التحقق بخطوتين</h1>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 25px;">
              رمز التحقق للدخول إلى بوابة الموظفين
            </p>
            <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0; border: 2px dashed #2563eb;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${code}</span>
            </div>
            <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
              ⏱️ هذا الرمز صالح لمدة 10 دقائق فقط
            </p>
            <p style="color: #94a3b8; font-size: 11px; margin-top: 15px;">
              إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
            <p style="color: #94a3b8; font-size: 11px;">
              عطلات رحلاتكم - بوابة الموظفين
            </p>
          </div>
        </body>
        </html>
      `;

      // Use Lovable's built-in email queue system
      const messageId = crypto.randomUUID();
      const emailPayload = {
        to: email,
        subject: "رمز التحقق للدخول - عطلات رحلاتكم",
        html: htmlContent,
        from: "عطلات رحلاتكم <noreply@visafaster.com>",
        sender_domain: "notify.visafaster.com",
        purpose: "transactional",
        idempotency_key: `staff-2fa-${userId}-${Date.now()}`,
        label: "staff-2fa",
        message_id: messageId,
        queued_at: new Date().toISOString(),
      };

      const { error: enqueueError } = await supabase.rpc("enqueue_email", {
        queue_name: "transactional_emails",
        payload: emailPayload,
      });

      if (enqueueError) {
        console.error("Failed to enqueue 2FA email:", enqueueError);
      } else {
        emailSent = true;
        console.log("2FA email enqueued successfully");
      }
    } catch (emailError: unknown) {
      console.error("Email sending failed:", emailError);
    }

    // ============================================================
    // NOTIFICATION: Notify admins about 2FA attempt
    // ============================================================
    try {
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminRoles && adminRoles.length > 0) {
        for (const admin of adminRoles) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", admin.user_id)
            .single();

          if (profile) {
            await supabase.from("notifications").insert({
              user_id: profile.id,
              title: "🔐 محاولة دخول جديدة",
              message: `تم إرسال رمز تحقق للموظف: ${email}`,
              type: "security",
              action_url: "/admin/users",
            });
          }
        }
      }
    } catch (notifyError) {
      console.error("Failed to notify admins:", notifyError);
    }

    // ============================================================
    // RESPONSE: Never return the code - only confirm send status
    // ============================================================
    return new Response(
      JSON.stringify({
        success: true,
        emailSent,
        smsSent: false,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-staff-2fa function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

Deno.serve(handler);
