import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  fullName: string;
}

// HTML escape function to prevent XSS and HTML injection
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  try {
    const { email, fullName }: WelcomeEmailRequest = await req.json();

    console.log(`[send-welcome-email] Starting for ${email} (${fullName})`);

    if (!email || !fullName) {
      console.error("[send-welcome-email] Missing required fields:", { email, fullName });
      return new Response(
        JSON.stringify({ error: "Email and fullName are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create professional HTML email with BetProfit branding
    console.log("[send-welcome-email] Creating HTML email...");
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
                Benvenuto in BetProfit! 🎉
              </h1>
              
              <p style="color: #f2f2f2; font-size: 16px; line-height: 26px; margin: 0 0 16px;">
                Ciao <strong style="color: #d4a574;">${escapeHtml(fullName)}</strong>,
              </p>
              
              <p style="color: #f2f2f2; font-size: 16px; line-height: 26px; margin: 0 0 16px;">
                Grazie per esserti registrato su <strong>BetProfit</strong>, la piattaforma professionale per il tracciamento e l'analisi delle tue scommesse sportive.
              </p>
              
              <p style="color: #f2f2f2; font-size: 16px; line-height: 26px; margin: 0 0 20px;">
                Con BetProfit potrai:
              </p>
              
              <!-- Benefits List -->
              <div style="margin: 24px 0; padding: 24px; background-color: #1f2937; border-radius: 8px; border-left: 4px solid #22c55e;">
                <p style="color: #f2f2f2; font-size: 15px; line-height: 28px; margin: 8px 0;">
                  <span style="color: #22c55e; font-weight: bold;">✓</span> Tracciare tutte le tue scommesse in un unico posto
                </p>
                <p style="color: #f2f2f2; font-size: 15px; line-height: 28px; margin: 8px 0;">
                  <span style="color: #22c55e; font-weight: bold;">✓</span> Analizzare le tue performance con grafici dettagliati
                </p>
                <p style="color: #f2f2f2; font-size: 15px; line-height: 28px; margin: 8px 0;">
                  <span style="color: #22c55e; font-weight: bold;">✓</span> Monitorare profitti e ROI in tempo reale
                </p>
                <p style="color: #f2f2f2; font-size: 15px; line-height: 28px; margin: 8px 0;">
                  <span style="color: #22c55e; font-weight: bold;">✓</span> Gestire bankroll e conti bookmaker
                </p>
                <p style="color: #f2f2f2; font-size: 15px; line-height: 28px; margin: 8px 0;">
                  <span style="color: #22c55e; font-weight: bold;">✓</span> Ricevere insights per migliorare le tue strategie
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 36px 0 24px;">
                <a href="https://betprofit.app" style="display: inline-block; background-color: #d4a574; color: #1f2937; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px; transition: opacity 0.2s;">
                  Inizia Subito
                </a>
              </div>
              
              <p style="color: #f2f2f2; font-size: 16px; line-height: 26px; margin: 32px 0 0; text-align: center;">
                Buone scommesse! 🎲<br>
                <span style="color: #d4a574; font-weight: 500;">Il Team di BetProfit</span>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(212, 165, 116, 0.2);">
              <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 8px 0; line-height: 20px;">
                Hai ricevuto questa email perché ti sei registrato su BetProfit.
              </p>
              <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 8px 0;">
                <a href="https://betprofit.app" style="color: #d4a574; text-decoration: none; font-weight: 500;">BetProfit</a> · La tua piattaforma di betting analytics
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    console.log("[send-welcome-email] HTML created successfully");

    // Send email via Resend
    console.log("[send-welcome-email] Sending via Resend...");
    const emailResponse = await resend.emails.send({
      from: "BetProfit <noreply@betprofit.app>",
      to: [email],
      subject: "Benvenuto in BetProfit! 🎉",
      html,
    });

    console.log("[send-welcome-email] Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send welcome email"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
