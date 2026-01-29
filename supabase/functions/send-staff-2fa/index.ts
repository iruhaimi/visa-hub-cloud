import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Send2FARequest {
  email: string;
  code: string;
  phone?: string; // Optional for SMS
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, phone }: Send2FARequest = await req.json();

    // Validate required fields
    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email and code" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending 2FA code to: ${email}`);

    // ============================================================
    // PLACEHOLDER: Configure your SMS/Email providers here
    // ============================================================
    
    // Check for configured providers
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

    let emailSent = false;
    let smsSent = false;
    const results: { email?: boolean; sms?: boolean; errors?: string[] } = {
      errors: [],
    };

    // ============================================================
    // EMAIL SENDING (using Resend when configured)
    // ============================================================
    if (RESEND_API_KEY) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "عطلات رحلاتكم <onboarding@resend.dev>", // Using Resend test domain - replace with your verified domain in production
            to: [email],
            subject: "رمز التحقق للدخول - عطلات رحلاتكم",
            html: `
              <!DOCTYPE html>
              <html dir="rtl" lang="ar">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #1e293b; color: #e2e8f0; margin: 0; padding: 20px;">
                <div style="max-width: 500px; margin: 0 auto; background-color: #334155; border-radius: 12px; padding: 30px; text-align: center;">
                  <div style="margin-bottom: 20px;">
                    <div style="background-color: #3b82f6; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 30px;">🔐</span>
                    </div>
                  </div>
                  <h1 style="color: #f8fafc; font-size: 24px; margin-bottom: 10px;">التحقق بخطوتين</h1>
                  <p style="color: #94a3b8; font-size: 14px; margin-bottom: 25px;">
                    رمز التحقق للدخول إلى بوابة الموظفين
                  </p>
                  <div style="background-color: #1e293b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #3b82f6;">${code}</span>
                  </div>
                  <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
                    ⏱️ هذا الرمز صالح لمدة 10 دقائق فقط
                  </p>
                  <p style="color: #64748b; font-size: 11px; margin-top: 15px;">
                    إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.
                  </p>
                  <hr style="border: none; border-top: 1px solid #475569; margin: 25px 0;">
                  <p style="color: #64748b; font-size: 11px;">
                    عطلات رحلاتكم - بوابة الموظفين
                  </p>
                </div>
              </body>
              </html>
            `,
          }),
        });

        if (emailResponse.ok) {
          emailSent = true;
          results.email = true;
          console.log("2FA email sent successfully");
        } else {
          const errorData = await emailResponse.json();
          console.error("Resend email error:", errorData);
          results.errors?.push(`Email error: ${JSON.stringify(errorData)}`);
        }
      } catch (emailError: unknown) {
        console.error("Email sending failed:", emailError);
        const errorMessage = emailError instanceof Error ? emailError.message : "Unknown error";
        results.errors?.push(`Email error: ${errorMessage}`);
      }
    } else {
      console.log("RESEND_API_KEY not configured - skipping email");
      results.errors?.push("Email provider not configured");
    }

    // ============================================================
    // SMS SENDING (using Twilio when configured)
    // ============================================================
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER && phone) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        
        const smsResponse = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          },
          body: new URLSearchParams({
            To: phone,
            From: TWILIO_PHONE_NUMBER,
            Body: `رمز التحقق للدخول إلى بوابة الموظفين: ${code}\n\nصالح لمدة 10 دقائق.\n\nعطلات رحلاتكم`,
          }),
        });

        if (smsResponse.ok) {
          smsSent = true;
          results.sms = true;
          console.log("2FA SMS sent successfully");
        } else {
          const errorData = await smsResponse.json();
          console.error("Twilio SMS error:", errorData);
          results.errors?.push(`SMS error: ${JSON.stringify(errorData)}`);
        }
      } catch (smsError: unknown) {
        console.error("SMS sending failed:", smsError);
        const errorMessage = smsError instanceof Error ? smsError.message : "Unknown error";
        results.errors?.push(`SMS error: ${errorMessage}`);
      }
    } else if (phone) {
      console.log("Twilio credentials not configured - skipping SMS");
      results.errors?.push("SMS provider not configured");
    }

    // ============================================================
    // NOTIFICATION: Notify admins about 2FA attempt
    // ============================================================
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get admin users to notify
        const { data: adminRoles } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        if (adminRoles && adminRoles.length > 0) {
          // Get profile IDs for admins
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
      }
    } catch (notifyError) {
      console.error("Failed to notify admins:", notifyError);
      // Non-critical - don't fail the request
    }

    // Check if at least one method worked or if none are configured (for testing)
    const noProviderConfigured = !RESEND_API_KEY && !TWILIO_ACCOUNT_SID;
    
    if (noProviderConfigured) {
      // In testing mode - just log and return success
      console.log(`[TEST MODE] 2FA code would be sent to ${email}: ${code}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Test mode - no providers configured",
          testMode: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!emailSent && !smsSent) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send 2FA code via any channel",
          details: results.errors,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailSent,
        smsSent,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-staff-2fa function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
