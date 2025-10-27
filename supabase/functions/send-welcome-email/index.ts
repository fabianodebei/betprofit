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

    // Create simple HTML email without React Email to avoid rendering issues
    console.log("[send-welcome-email] Creating HTML email...");
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
                Benvenuto in BetProfit! 🎉
              </h1>
              <p style="color: #e5e5e5; font-size: 16px; line-height: 26px; margin: 0 0 16px;">
                Ciao <strong>${fullName}</strong>,
              </p>
              <p style="color: #e5e5e5; font-size: 16px; line-height: 26px; margin: 0 0 16px;">
                Grazie per esserti registrato su <strong>BetProfit</strong>, la piattaforma professionale per il tracciamento e l'analisi delle tue scommesse sportive.
              </p>
              <p style="color: #e5e5e5; font-size: 16px; line-height: 26px; margin: 0 0 16px;">
                Con BetProfit potrai:
              </p>
              <div style="margin: 24px 0; padding: 20px; background-color: #2a2a2a; border-radius: 8px; border-left: 4px solid #D4AF37;">
                <p style="color: #e5e5e5; font-size: 15px; line-height: 24px; margin: 8px 0;">✅ Tracciare tutte le tue scommesse in un unico posto</p>
                <p style="color: #e5e5e5; font-size: 15px; line-height: 24px; margin: 8px 0;">📊 Analizzare le tue performance con grafici dettagliati</p>
                <p style="color: #e5e5e5; font-size: 15px; line-height: 24px; margin: 8px 0;">💰 Monitorare profitti e ROI in tempo reale</p>
                <p style="color: #e5e5e5; font-size: 15px; line-height: 24px; margin: 8px 0;">🎯 Gestire bankroll e conti bookmaker</p>
                <p style="color: #e5e5e5; font-size: 15px; line-height: 24px; margin: 8px 0;">📈 Ricevere insights per migliorare le tue strategie</p>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://betprofit.app" style="display: inline-block; background-color: #D4AF37; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 40px; border-radius: 6px;">
                  Inizia Subito
                </a>
              </div>
              <p style="color: #e5e5e5; font-size: 16px; line-height: 26px; margin: 32px 0 16px;">
                Buone scommesse! 🎲<br>
                Il Team di BetProfit
              </p>
              <div style="border-top: 1px solid #333333; margin-top: 32px; padding-top: 24px;">
                <p style="color: #888888; font-size: 13px; text-align: center; margin: 8px 0;">
                  Hai ricevuto questa email perché ti sei registrato su BetProfit.
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
        error: error.message,
        details: error.toString() 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
