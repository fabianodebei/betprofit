import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  message: z.string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(4096, 'Message exceeds maximum length'),
  user_id: z.string().uuid().optional(),
});

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('Invalid JSON body');
      return new Response(
        JSON.stringify({ success: false }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Validate request with Zod
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation error:', validation.error.errors);
      return new Response(
        JSON.stringify({ success: false }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const { message, user_id: body_user_id } = validation.data;

    // Determine user_id: allow internal service calls with service key, otherwise require user JWT
    let user_id: string;
    const authHeader = req.headers.get('Authorization') || '';
    
    if (body_user_id) {
      // Only allow internal calls (e.g., from check-notifications) to specify user_id
      if (authHeader !== `Bearer ${supabaseServiceKey}`) {
        console.error('Unauthorized internal call: missing or invalid service key');
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
      user_id = body_user_id;
      console.log('Using user_id from internal call:', user_id);
    } else {
      // Otherwise, extract from user JWT
      if (!authHeader.startsWith('Bearer ')) {
        console.error('Missing or invalid authorization header');
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      const jwt = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
      
      if (authError || !user) {
        console.error('Authentication failed');
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      user_id = user.id;
      console.log('Using user_id from JWT:', user_id);
    }

    // Get user's Telegram configuration (decrypted via secure view)
    const { data: config, error: configError } = await supabase
      .from('user_telegram_config_decrypted')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (configError) {
      console.error('Config fetch failed');
      return new Response(
        JSON.stringify({ success: false }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (!config || !config.notifications_enabled || !config.telegram_bot_token || !config.telegram_chat_id) {
      console.log('Notification not sent: configuration incomplete or disabled');
      return new Response(
        JSON.stringify({ success: false, error: 'Telegram configuration incomplete or notifications disabled' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Log token diagnostic info (length and char codes of last few chars to detect padding)
    const tokenLen = config.telegram_bot_token.length;
    const lastChars = config.telegram_bot_token.slice(-5);
    const lastCharCodes = [...lastChars].map((c: string) => c.charCodeAt(0));
    console.log(`Token length: ${tokenLen}, last char codes: [${lastCharCodes.join(',')}]`);

    // Trim any null bytes or whitespace that might come from AES padding
    const cleanToken = config.telegram_bot_token.replace(/\0+$/g, '').trim();
    const cleanChatId = config.telegram_chat_id.replace(/\0+$/g, '').trim();

    // Validate token format before use
    if (!cleanToken.match(/^\d+:[A-Za-z0-9_-]{35,}$/)) {
      console.error('Invalid bot token format in database, clean length:', cleanToken.length);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid Telegram configuration' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Validate chat ID format
    if (!cleanChatId.match(/^-?\d+$/)) {
      console.error('Invalid chat ID format in database');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid Telegram configuration' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const telegramUrl = `https://api.telegram.org/bot${cleanToken}/sendMessage`;

    console.log('Sending notification');

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      console.error('External API error:', response.status);
      return new Response(
        JSON.stringify({ success: false }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('Notification sent');

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Function error:', error.name);
    return new Response(
      JSON.stringify({ success: false }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
