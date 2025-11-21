import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-notification-signature',
};

// HTML escape function for Telegram HTML messages to prevent injection attacks
function escapeHtml(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Sanitize and validate individual fields before message construction
function sanitizeField(field: string | null | undefined, maxLength: number, fieldName?: string): string {
  if (!field) return '';
  
  const sanitized = String(field).trim();
  
  // Validate length and truncate if necessary
  if (sanitized.length > maxLength) {
    if (fieldName) {
      console.warn(`Field '${fieldName}' exceeded max length (${sanitized.length}/${maxLength}), truncating`);
    }
    return sanitized.substring(0, maxLength - 3) + '...';
  }
  
  return sanitized;
}

// Rate limiting configuration
const RATE_LIMIT_SECONDS = 50; // 50 seconds minimum between calls

// HMAC signature verification (simplified for cron job access)
function verifySignature(request: Request): boolean {
  const secret = Deno.env.get('NOTIFICATION_HMAC_SECRET');
  if (!secret) {
    console.log('HMAC secret not configured, allowing request');
    return true; // Allow if not configured
  }

  const signature = request.headers.get('x-notification-signature');
  if (!signature) {
    console.error('Missing x-notification-signature header');
    return false;
  }

  // Simple check - signature must match the secret itself (for cron simplicity)
  return signature === secret;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Notification check triggered');
    // Authenticated endpoint: JWT verification enabled in config.toml
    // Cron job calls with service role key for authentication
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Distributed rate limiting check using database
    const { data: canProceed, error: rateLimitError } = await supabase
      .rpc('try_acquire_rate_limit', {
        function_id: 'check-notifications',
        rate_limit_seconds: RATE_LIMIT_SECONDS
      });
    
    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError.message);
      return new Response(
        JSON.stringify({ success: false }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
    
    if (!canProceed) {
      console.log('Rate limit exceeded, rejecting request');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded',
          retryAfter: RATE_LIMIT_SECONDS
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('Starting notification check...');

    // Check reminders
    await checkReminders(supabase, supabaseUrl, supabaseServiceKey);

    // Check lay bets to notify (this handles all bet notifications correctly)
    await checkLayBets(supabase, supabaseUrl, supabaseServiceKey);

    return new Response(
      JSON.stringify({ success: true, message: 'Notification check completed' }),
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

async function checkReminders(supabase: any, supabaseUrl: string, serviceKey: string) {
  console.log('Processing reminders');

  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*, user_id')
    .eq('stato', 'Nuovo');

  if (error) {
    console.error('Query failed');
    return;
  }

  console.log(`Processing ${reminders?.length || 0} items`);

  const now = new Date();

  for (const reminder of reminders || []) {
    // Check if already notified
    const { data: existingLog } = await supabase
      .from('notification_logs')
      .select('id')
      .eq('type', 'reminder')
      .eq('reference_id', reminder.id)
      .single();

    if (existingLog) {
      continue;
    }

    const scadenza = new Date(reminder.data_di_scadenza);
    let notificationTime = new Date(scadenza);

    // Calculate notification time based on period
    switch (reminder.notifica_periodo) {
      case '24h':
        notificationTime.setHours(notificationTime.getHours() - 24);
        break;
      case '12h':
        notificationTime.setHours(notificationTime.getHours() - 12);
        break;
      case '0h':
        // No adjustment needed, notify at exact time
        break;
    }

    // Send notification if time has arrived (with 1 minute tolerance)
    if (now >= new Date(notificationTime.getTime() - 60000)) {
      // Sanitize all user-provided fields with appropriate length limits
      const metodo = sanitizeField(reminder.metodo, 100, 'reminder.metodo');
      const conto = sanitizeField(reminder.conto, 100, 'reminder.conto');
      const descrizione = sanitizeField(reminder.descrizione, 500, 'reminder.descrizione');
      
      const message = `🔔 <b>PROMEMORIA IN SCADENZA</b>\n\n` +
        `📋 Metodo: ${escapeHtml(metodo)}\n` +
        `💳 Conto: ${escapeHtml(conto)}\n` +
        `📝 Descrizione: ${escapeHtml(descrizione)}\n` +
        `⏰ Scadenza: ${formatDate(scadenza)}`;

      console.log('Sending notification');

      await fetch(`${supabaseUrl}/functions/v1/send-telegram-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ 
          message,
          user_id: reminder.user_id 
        }),
      });

      // Log notification
      await supabase
        .from('notification_logs')
        .insert({
          type: 'reminder',
          reference_id: reminder.id,
        });

      // Update reminder status
      await supabase
        .from('reminders')
        .update({ stato: 'Letto' })
        .eq('id', reminder.id);

      console.log('Notification sent');
    }
  }
}

async function checkLayBets(supabase: any, supabaseUrl: string, serviceKey: string) {
  console.log('Processing lay bets');

  const { data: layBets, error } = await supabase
    .from('lay_bets')
    .select('*, user_id')
    .eq('stato', 'In Corso')
    .eq('attiva', true);

  if (error) {
    console.error('Query failed for lay bets');
    return;
  }

  console.log(`Processing ${layBets?.length || 0} lay bet items`);

  const now = new Date();

  for (const layBet of layBets || []) {
    // Check if already notified with more robust duplicate prevention
    const { data: existingLog } = await supabase
      .from('notification_logs')
      .select('id')
      .eq('type', 'lay_bet')
      .eq('reference_id', layBet.id)
      .maybeSingle();

    if (existingLog) {
      console.log(`Lay bet ${layBet.id} already notified, skipping`);
      continue;
    }

    const eventDate = new Date(layBet.data_evento);
    
    // Add 1 hour and 40 minutes (100 minutes) after the match starts
    const reportTime = new Date(eventDate.getTime() + 100 * 60 * 1000);

    // Send notification if time has arrived
    if (now >= reportTime) {
      // Check if there are more lay bets for the same parent bet with later dates
      const { data: futureLays, error: futureError } = await supabase
        .from('lay_bets')
        .select('id, data_evento')
        .eq('parent_bet_id', layBet.parent_bet_id)
        .eq('attiva', true)
        .gt('data_evento', layBet.data_evento)
        .order('data_evento', { ascending: true });

      if (futureError) {
        console.error('Error checking future lay bets:', futureError);
        continue;
      }

      const hasMoreLays = futureLays && futureLays.length > 0;
      
      // Sanitize all user-provided fields
      const metodo = sanitizeField(layBet.metodo, 50, 'layBet.metodo');
      const evento = sanitizeField(layBet.evento, 200, 'layBet.evento');
      const mercato = sanitizeField(layBet.mercato, 100, 'layBet.mercato');
      const conto = sanitizeField(layBet.conto, 100, 'layBet.conto');
      
      let message = `🎯 <b>BANCATA CONCLUSA</b>\n\n` +
        `📋 Metodo: ${escapeHtml(metodo)}\n` +
        `🎮 Evento: ${escapeHtml(evento)}\n` +
        `📊 Mercato: ${escapeHtml(mercato)}\n` +
        `💳 Conto: ${escapeHtml(conto)}\n` +
        `💰 Stake: €${formatCurrency(layBet.stake)}\n` +
        `📈 Quota Punta: ${layBet.quota_punta}\n` +
        `📉 Quota Banca: ${layBet.quota_banca}\n` +
        `🕐 Conclusa: ${formatDate(eventDate)}\n\n`;

      if (hasMoreLays) {
        const nextDate = new Date(futureLays[0].data_evento);
        message += `⚠️ <b>Banca la prossima giocata!</b>\n` +
          `📅 Prossimo evento: ${formatDate(nextDate)}`;
      } else {
        message += `✅ <b>Ultima bancata - Archivia la scommessa!</b>`;
      }

      console.log(`Sending lay bet notification for ${layBet.id}`);

      // Log notification BEFORE sending to prevent duplicates in race conditions
      const { error: logError } = await supabase
        .from('notification_logs')
        .insert({
          type: 'lay_bet',
          reference_id: layBet.id,
        });

      // If insert fails (duplicate), skip this notification
      if (logError) {
        console.log(`Notification already logged for lay bet ${layBet.id}, skipping`);
        continue;
      }

      await fetch(`${supabaseUrl}/functions/v1/send-telegram-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ 
          message,
          user_id: layBet.user_id 
        }),
      });

      console.log('Lay bet notification sent');
    }
  }
}

function formatDate(date: Date): string {
  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  });
}

function formatCurrency(value: number): string {
  return value.toFixed(2);
}

serve(handler);
