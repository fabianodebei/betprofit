import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramMessageRequest {
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message }: TelegramMessageRequest = await req.json();

    // TODO: Replace with secret when available
    // Use Deno.env.get('TELEGRAM_BOT_TOKEN') and Deno.env.get('TELEGRAM_CHAT_ID')
    const TELEGRAM_BOT_TOKEN = '8060304129:AAGKW7jxpQsw8fwRbZjWLBUd7MD4dLLolp8';
    const TELEGRAM_CHAT_ID = '77204387';

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    console.log('Sending Telegram notification...');

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Telegram API error:', data);
      throw new Error(`Telegram API error: ${JSON.stringify(data)}`);
    }

    console.log('Telegram notification sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in send-telegram-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
