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

    const redirect = redirectTo || `${SUPABASE_URL}`;

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

    // Create simple HTML email
    console.log("[request-password-reset] Creating HTML email...");
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #1a1a1a; padding: 40px; border-radius: 8px;">
              <h1 style="color: #D4AF37; font-size: 28px; text-align: center; margin: 0 0 24px;">
                Reset Password 🔐
              </h1>
              <p style="color: #e5e5e5; font-size: 16px; line-height: 26px; margin: 0 0 16px;">
                Ciao <strong>${fullName}</strong>,
              </p>
              <p style="color: #e5e5e5; font-size: 16px; line-height: 26px; margin: 0 0 16px;">
                Abbiamo ricevuto una richiesta per reimpostare la password del tuo account BetProfit.
              </p>
              <div style="background-color: #2a2a2a; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #ff9800;">
                <p style="color: #ff9800; font-size: 15px; margin: 0; text-align: center;">
                  ⏰ <strong>Questo link è valido per 1 ora</strong>
                </p>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${actionLink}" style="display: inline-block; background-color: #D4AF37; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 40px; border-radius: 6px;">
                  Reimposta Password
                </a>
              </div>
              <p style="color: #e5e5e5; font-size: 16px; line-height: 26px; margin: 0 0 16px;">
                Se il pulsante non funziona, copia e incolla questo link nel tuo browser:
              </p>
              <div style="background-color: #2a2a2a; border-radius: 6px; padding: 16px; margin: 16px 0 24px; word-break: break-all;">
                <p style="color: #D4AF37; font-size: 13px; margin: 0;">${actionLink}</p>
              </div>
              <div style="background-color: #1e3a1e; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #4caf50;">
                <p style="color: #a5d6a7; font-size: 14px; line-height: 22px; margin: 0;">
                  🛡️ <strong>Nota di sicurezza:</strong> Se non hai richiesto questo reset, ignora questa email. La tua password rimarrà invariata e il tuo account è sicuro.
                </p>
              </div>
              <p style="color: #e5e5e5; font-size: 16px; line-height: 26px; margin: 32px 0 16px;">
                Cordiali saluti,<br>
                Il Team di BetProfit
              </p>
              <div style="border-top: 1px solid #333333; margin-top: 32px; padding-top: 24px;">
                <p style="color: #888888; font-size: 13px; text-align: center; margin: 8px 0;">
                  Questa è un'email automatica, per favore non rispondere.
                </p>
                <p style="color: #888888; font-size: 13px; text-align: center; margin: 8px 0;">
                  <a href="https://betprofit.app" style="color: #D4AF37; text-decoration: none;">BetProfit</a> - La tua piattaforma di betting analytics
                </p>
              </div>
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