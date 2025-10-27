import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  email: string;
  redirectTo?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { email, redirectTo }: RequestBody = await req.json();

    console.log(`[request-password-reset] Starting for ${email}`);

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Redirect to reset password page
    const redirect = redirectTo || "https://betprofit.app/reset-password";

    // Generate password recovery link using service role
    console.log("[request-password-reset] Generating recovery link...");
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: redirect },
    });

    if (error) {
      console.error("[request-password-reset] generateLink error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const actionLink = (data as any)?.properties?.action_link || (data as any)?.action_link;
    if (!actionLink) {
      console.error("[request-password-reset] No action_link in generateLink response", data);
      return new Response(JSON.stringify({ error: "Unable to generate reset link" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const fullName = email.split("@")[0];

    // Create professional HTML email with BetProfit branding
    console.log("[request-password-reset] Creating HTML email...");
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #2b3d4f; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header with Logo -->
            <div style="text-align: center; margin-bottom: 32px;">
              <img src="https://betprofit.app/logo_centurion_email.webp" alt="BetProfit Logo" style="max-width: 200px; height: auto;" />
            </div>
            
            <!-- Main Card -->
            <div style="background-color: #283644; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">
              <h1 style="color: #d4a574; font-size: 28px; text-align: center; margin: 0 0 24px; font-weight: 600;">
                Recupera la tua Password 🔐
              </h1>
              
              <p style="color: #f2f2f2; font-size: 16px; line-height: 26px; margin: 0 0 16px;">
                Ciao <strong style="color: #d4a574;">${fullName}</strong>,
              </p>
              
              <p style="color: #f2f2f2; font-size: 16px; line-height: 26px; margin: 0 0 16px;">
                Hai richiesto di reimpostare la password del tuo account <strong style="color: #d4a574;">BetProfit</strong>.
              </p>
              
              <p style="color: #f2f2f2; font-size: 16px; line-height: 26px; margin: 0 0 24px;">
                Clicca sul pulsante qui sotto per procedere:
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${actionLink}" style="display: inline-block; background-color: #d4a574; color: #1f2937; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px; transition: opacity 0.2s;">
                  Reimposta Password
                </a>
              </div>
              
              <!-- Warning Box -->
              <div style="margin: 24px 0; padding: 20px; background-color: #1f2937; border-radius: 8px; border-left: 4px solid #ef4444;">
                <p style="color: #fca5a5; font-size: 14px; line-height: 22px; margin: 0;">
                  <strong style="color: #ef4444;">⚠️ Importante:</strong> Questo link scadrà tra 1 ora per motivi di sicurezza.
                </p>
              </div>
              
              <p style="color: #f2f2f2; font-size: 14px; line-height: 24px; margin: 24px 0 0;">
                Se il pulsante non funziona, copia e incolla questo link:
              </p>
              
              <div style="background-color: #1f2937; border-radius: 6px; padding: 14px; margin: 12px 0 24px; word-break: break-all;">
                <p style="color: #d4a574; font-size: 12px; margin: 0; font-family: monospace;">${actionLink}</p>
              </div>
              
              <p style="color: #9ca3af; font-size: 14px; line-height: 24px; margin: 24px 0 0; text-align: center;">
                Se non hai richiesto questa operazione, puoi ignorare questa email in tutta sicurezza.
              </p>
              
              <p style="color: #f2f2f2; font-size: 16px; line-height: 26px; margin: 32px 0 0; text-align: center;">
                <span style="color: #d4a574; font-weight: 500;">Il Team di BetProfit</span>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(212, 165, 116, 0.2);">
              <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 8px 0;">
                <a href="https://betprofit.app" style="color: #d4a574; text-decoration: none; font-weight: 500;">BetProfit</a> · La tua piattaforma di betting analytics
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    console.log("[request-password-reset] HTML created successfully");

    // Send email via Resend
    console.log("[request-password-reset] Sending via Resend...");
    const emailResponse = await resend.emails.send({
      from: "BetProfit <noreply@betprofit.app>",
      to: [email],
      subject: "Reset della password - BetProfit 🔐",
      html,
    });

    console.log("[request-password-reset] Email sent successfully:", emailResponse?.data?.id || "ok");

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in request-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});