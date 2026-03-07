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

    // Check bets to report (1 hour and 40 minutes after match start)
    await checkBetsToReport(supabase, supabaseUrl, supabaseServiceKey);

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

async function sendTelegramNotification(
  supabaseUrl: string,
  serviceKey: string,
  message: string,
  userId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-telegram-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        message,
        user_id: userId,
      }),
    });

    let payload: any = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok || !payload?.success) {
      console.error(`Telegram send failed for user ${userId}: status ${response.status}, error ${payload?.error || 'unknown'}`);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error(`Telegram send exception for user ${userId}:`, error?.message || error);
    return false;
  }
}

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

      const sent = await sendTelegramNotification(
        supabaseUrl,
        serviceKey,
        message,
        reminder.user_id
      );

      if (!sent) {
        console.warn(`Skipping reminder ${reminder.id}: Telegram send failed`);
        continue;
      }

      // Log notification only after successful delivery
      await supabase
        .from('notification_logs')
        .insert({
          type: 'reminder',
          reference_id: reminder.id,
        });

      // Update reminder status only after successful delivery
      await supabase
        .from('reminders')
        .update({ stato: 'Letto' })
        .eq('id', reminder.id);

      console.log('Notification sent');
    }
  }
}

async function checkBetsToReport(supabase: any, supabaseUrl: string, serviceKey: string) {
  console.log('Processing bets');

  const { data: bets, error } = await supabase
    .from('bets')
    .select('*, user_id')
    .eq('stato', 'In Corso')
    .neq('tipo', 'Rapida');

  if (error) {
    console.error('Query failed');
    return;
  }

  console.log(`Processing ${bets?.length || 0} items`);

  const now = new Date();

  for (const bet of bets || []) {
    // Check if already notified
    const { data: existingLog } = await supabase
      .from('notification_logs')
      .select('id')
      .eq('type', 'bet')
      .eq('reference_id', bet.id)
      .single();

    if (existingLog) {
      continue;
    }

    let eventDate: Date;
    const isMultiple = bet.tipo === 'Multipla';
    
    // For multiple bets, find the first match date from bet_legs
    if (isMultiple) {
      const { data: legs, error: legsError } = await supabase
        .from('bet_legs')
        .select('data_evento')
        .eq('bet_id', bet.id)
        .order('data_evento', { ascending: true })
        .limit(1);
      
      if (legsError || !legs || legs.length === 0) {
        console.warn(`No bet_legs found for multiple bet ${bet.id}, skipping`);
        continue;
      }
      
      eventDate = new Date(legs[0].data_evento);
      console.log(`Multiple bet ${bet.id}: using first match date ${eventDate.toISOString()}`);
    } else {
      // For single bets, use the bet's event date
      eventDate = new Date(bet.data_evento);
    }
    
    // Add 1 hour and 40 minutes (100 minutes) after the first match starts
    const reportTime = new Date(eventDate.getTime() + 100 * 60 * 1000);

    // Send notification if time has arrived
    if (now >= reportTime) {
      const isMultiple = bet.tipo === 'Multipla';
      
      // Sanitize all user-provided fields with appropriate length limits
      const tipo = sanitizeField(bet.tipo, 50, 'bet.tipo');
      const evento = sanitizeField(bet.evento, 200, 'bet.evento');
      const nomeGioco = sanitizeField(bet.nome_gioco, 200, 'bet.nome_gioco');
      const conto = sanitizeField(bet.conto, 100, 'bet.conto');
      const tag = sanitizeField(bet.tag, 100, 'bet.tag');
      const note = sanitizeField(bet.note, 500, 'bet.note');
      
      let message = `⚽ <b>PARTITA CONCLUSA${isMultiple ? ' - MULTIPLA' : ''}</b>\n\n` +
        `🎯 Tipo: ${escapeHtml(tipo)}\n`;

      if (evento) {
        message += `🎮 Evento: ${escapeHtml(evento)}\n`;
      }
      if (nomeGioco) {
        message += `🎰 Gioco: ${escapeHtml(nomeGioco)}\n`;
      }

      message += `💳 Conto: ${escapeHtml(conto)}\n` +
        `💰 Stake: €${formatCurrency(bet.stake)}\n`;

      if (bet.quota) {
        message += `📊 Quota: ${bet.quota}\n`;
      }

      message += `🕐 Iniziata: ${formatDate(eventDate)}\n`;

      if (tag) {
        message += `🏷️ Tag: ${escapeHtml(tag)}\n`;
      }

      if (note) {
        message += `📝 Note: ${escapeHtml(note)}\n`;
      }

      if (isMultiple) {
        // Check if there are still pending lay bets for this multipla
        const { data: pendingLays } = await supabase
          .from('lay_bets')
          .select('id')
          .eq('parent_bet_id', bet.id)
          .eq('stato', 'In Corso');

        const hasPendingLays = pendingLays && pendingLays.length > 0;

        if (hasPendingLays) {
          message += `\n⚠️ <b>Banca la prossima scommessa della multipla!</b>`;
        } else {
          message += `\n✅ Archivia la scommessa`;
        }
      } else {
        message += `\n✅ Archivia la scommessa`;
      }

      console.log('Sending notification');

      const sent = await sendTelegramNotification(
        supabaseUrl,
        serviceKey,
        message,
        bet.user_id
      );

      if (!sent) {
        console.warn(`Skipping bet ${bet.id}: Telegram send failed`);
        continue;
      }

      // Log notification only after successful delivery
      await supabase
        .from('notification_logs')
        .insert({
          type: 'bet',
          reference_id: bet.id,
        });

      console.log('Notification sent');
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
