import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { renderAsync } from "https://esm.sh/@react-email/components@0.0.22";
import React from "https://esm.sh/react@18.3.1";
import { ConfirmationEmail } from "../_shared/email-templates/confirmation-email.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    // Verify webhook signature
    const wh = new Webhook(hookSecret);
    let verifiedPayload;
    
    try {
      verifiedPayload = wh.verify(payload, headers) as {
        user: {
          email: string;
        };
        email_data: {
          token: string;
          token_hash: string;
          redirect_to: string;
          email_action_type: string;
          site_url: string;
        };
      };
    } catch (error) {
      console.error("Webhook verification failed:", error);
      return new Response(
        JSON.stringify({
          error: {
            http_code: 401,
            message: "Webhook verification failed",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { user, email_data } = verifiedPayload;
    const { token_hash, redirect_to, email_action_type } = email_data;

    console.log(`Sending confirmation email to ${user.email}`);

    // Construct confirmation link
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const confirmationLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    // Get user's full name (use email username as fallback)
    const fullName = user.email.split("@")[0];

    // Render the React Email template to HTML
    const html = await renderAsync(
      React.createElement(ConfirmationEmail, {
        fullName,
        confirmationLink,
      })
    );

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "BetProfit <noreply@betprofit.app>",
      to: [user.email],
      subject: "Conferma il tuo account BetProfit ✉️",
      html,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-confirmation-email function:", error);
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message,
        },
      }),
      {
        status: error.code || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
