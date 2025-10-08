import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    console.error('Error in check-notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

async function checkReminders(supabase: any, supabaseUrl: string, serviceKey: string) {
  console.log('Checking reminders...');

  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('stato', 'Nuovo');

  if (error) {
    console.error('Error fetching reminders:', error);
    return;
  }

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
      console.log(`Reminder ${reminder.id} already notified`);
      continue;
    }

    const scadenza = new Date(reminder.data_di_scadenza);
    let notificationTime = new Date(scadenza);

    // Calculate notification time based on period
    switch (reminder.notifica_periodo) {
      case '15min':
        notificationTime.setMinutes(notificationTime.getMinutes() - 15);
        break;
      case '30min':
        notificationTime.setMinutes(notificationTime.getMinutes() - 30);
        break;
      case '1h':
        notificationTime.setHours(notificationTime.getHours() - 1);
        break;
      case '1g':
        notificationTime.setDate(notificationTime.getDate() - 1);
        break;
      case '1set':
        notificationTime.setDate(notificationTime.getDate() - 7);
        break;
    }

    // Send notification if time has arrived
    if (now >= notificationTime) {
      const message = `🔔 <b>PROMEMORIA IN SCADENZA</b>\n\n` +
        `📋 Metodo: ${reminder.metodo}\n` +
        `💳 Conto: ${reminder.conto}\n` +
        `📝 Descrizione: ${reminder.descrizione}\n` +
        `⏰ Scadenza: ${formatDate(scadenza)}`;

      console.log('Sending reminder notification:', reminder.id);

      await fetch(`${supabaseUrl}/functions/v1/send-telegram-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ message }),
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

      console.log('Reminder notification sent:', reminder.id);
    }
  }
}

async function checkBetsToReport(supabase: any, supabaseUrl: string, serviceKey: string) {
  console.log('Checking bets to report...');

  const { data: bets, error } = await supabase
    .from('bets')
    .select('*')
    .eq('stato', 'In Corso')
    .neq('tipo', 'Rapida');

  if (error) {
    console.error('Error fetching bets:', error);
    return;
  }

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
      console.log(`Bet ${bet.id} already notified`);
      continue;
    }

    const eventDate = new Date(bet.data_evento);
    // Add 1 hour and 40 minutes (100 minutes)
    const reportTime = new Date(eventDate.getTime() + 100 * 60 * 1000);

    // Send notification if time has arrived
    if (now >= reportTime) {
      const isMultiple = bet.tipo === 'Multipla';
      
      let message = `⚽ <b>PARTITA DA REFERTARE${isMultiple ? ' - MULTIPLA' : ''}</b>\n\n` +
        `🎯 Tipo: ${bet.tipo}\n`;

      if (bet.evento) {
        message += `🎮 Evento: ${bet.evento}\n`;
      }
      if (bet.nome_gioco) {
        message += `🎰 Gioco: ${bet.nome_gioco}\n`;
      }

      message += `💳 Conto: ${bet.conto}\n` +
        `💰 Stake: €${formatCurrency(bet.stake)}\n`;

      if (bet.quota) {
        message += `📊 Quota: ${bet.quota}\n`;
      }

      message += `🕐 Iniziata: ${formatDate(eventDate)}\n`;

      if (bet.tag) {
        message += `🏷️ Tag: ${bet.tag}\n`;
      }

      if (bet.note) {
        message += `📝 Note: ${bet.note}\n`;
      }

      message += `\n✅ Referta il risultato della scommessa`;

      if (isMultiple) {
        message += `\n⚠️ <b>Banca la prossima scommessa della multipla!</b>`;
      }

      console.log('Sending bet notification:', bet.id);

      await fetch(`${supabaseUrl}/functions/v1/send-telegram-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ message }),
      });

      // Log notification
      await supabase
        .from('notification_logs')
        .insert({
          type: 'bet',
          reference_id: bet.id,
        });

      console.log('Bet notification sent:', bet.id);
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
  });
}

function formatCurrency(value: number): string {
  return value.toFixed(2);
}

serve(handler);
