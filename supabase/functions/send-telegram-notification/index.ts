import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramMessageRequest {
  message: string;
  user_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const { message, user_id } = body as TelegramMessageRequest;

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Get user's Telegram configuration
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: config, error: configError } = await supabase
      .from('user_telegram_config')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (configError || !config) {
      console.log('No Telegram configuration found for user:', user_id);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'User has no Telegram configuration' 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Check if notifications are enabled
    if (!config.notifications_enabled) {
      console.log('Notifications disabled for user:', user_id);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Notifications are disabled for this user' 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Check if user has configured Telegram credentials
    if (!config.telegram_bot_token || !config.telegram_chat_id) {
      console.log('User has not configured Telegram credentials:', user_id);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'User has not configured Telegram credentials' 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const telegramUrl = `https://api.telegram.org/bot${config.telegram_bot_token}/sendMessage`;

    console.log('Sending Telegram notification to user:', user_id);

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: config.telegram_chat_id,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Telegram API error:', data);
      throw new Error(`Telegram API error: ${JSON.stringify(data)}`);
    }

    console.log('Telegram notification sent successfully to user:', user_id);

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
