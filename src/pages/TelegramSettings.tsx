import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTelegramConfig } from '@/contexts/TelegramConfigContext';
import { Info, MessageSquare, ArrowLeft, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import telegramQR from '@/assets/telegram-qr.jpeg';

const formSchema = z.object({
  telegram_bot_token: z.string()
    .refine(
      (val) => !val || val === '' || /^\d+:[A-Za-z0-9_-]{35,}$/.test(val),
      'Formato token non valido. Deve essere nel formato: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz'
    )
    .optional(),
  telegram_chat_id: z.string()
    .refine(
      (val) => !val || val === '' || /^-?\d+$/.test(val),
      'Chat ID deve essere un numero (può essere negativo per i gruppi)'
    )
    .optional(),
  notifications_enabled: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

const TelegramSettings = () => {
  const navigate = useNavigate();
  const { config, loading, updateConfig } = useTelegramConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      telegram_bot_token: '',
      telegram_chat_id: '',
      notifications_enabled: true,
    },
  });

  // Fetch user's credentials to check if they exist and populate form
  useEffect(() => {
    const fetchCredentials = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_telegram_config')
        .select('telegram_bot_token_encrypted, telegram_chat_id_encrypted, notifications_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        // Check encrypted columns to determine if credentials exist
        setHasCredentials(!!(data.telegram_bot_token_encrypted && data.telegram_chat_id_encrypted));
        form.reset({
          telegram_bot_token: '',
          telegram_chat_id: '',
          notifications_enabled: data.notifications_enabled ?? true,
        });
      }
    };

    fetchCredentials();
  }, [form]);

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await updateConfig(data);
      setHasCredentials(!!(data.telegram_bot_token && data.telegram_chat_id));
      // Clear sensitive fields after save
      form.setValue('telegram_bot_token', '');
      form.setValue('telegram_chat_id', '');
    } catch (error) {
      // Error is handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col items-center">
        <Button 
          variant="outline" 
          onClick={() => navigate('/impostazioni')}
          className="self-start mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alle Impostazioni
        </Button>
        <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Configurazione Telegram
          </h1>
          <p className="text-muted-foreground mt-2">
            Configura il tuo BOT Telegram personale per ricevere notifiche
          </p>
        </div>
      </div>

      <div className="grid gap-6 max-w-2xl mx-auto">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Come configurare il tuo BOT Telegram:</strong>
            <ol className="list-decimal ml-4 mt-2 space-y-1">
              <li>Apri Telegram e cerca <strong>BotFather</strong> con il bollino blu</li>
              <li>Clicca sul tasto <strong>Avvia</strong></li>
              <li>Invia il comando <code className="bg-muted px-1 rounded">/newbot</code> e segui le istruzioni</li>
              <li>Scegli il nome del bot (metti qualcosa che ricordi il betprofit) e premi <strong>INVIA</strong></li>
              <li>Ora devi inserire il nome del bot (mi raccomando deve finire con <strong>bot</strong> es: betprofitbot) e premi <strong>INVIA</strong></li>
              <li>Copia il token che ricevi e incollalo qui sotto</li>
              <li>Clicca sul link del tuo nuovo bot subito dopo "Done! Congratulations on your new bot. You will find it at" e poi clicca su <strong>AVVIA</strong></li>
              <li>Torna nella pagina principale di Telegram e cerca il canale <code className="bg-muted px-1 rounded">@userinfobot</code> quello con 400.000 utenti</li>
              <li>Clicca <strong>AVVIA</strong></li>
              <li>Copia l'ID che esce e incollalo qui sotto nel campo Chat ID, poi clicca <strong>Salva Configurazione</strong></li>
            </ol>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Credenziali BOT</CardTitle>
            <CardDescription>
              Inserisci le credenziali del tuo BOT Telegram personale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="telegram_bot_token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>BOT Token</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={hasCredentials ? "••••••••••••••••••••" : "1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {hasCredentials ? 'Token già configurato. Inserisci un nuovo valore per aggiornarlo.' : 'Il token fornito da @BotFather'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telegram_chat_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chat ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={hasCredentials ? "••••••••••" : "123456789"}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {hasCredentials ? 'Chat ID già configurato. Inserisci un nuovo valore per aggiornarlo.' : 'Il tuo Chat ID personale (ottienilo da @userinfobot)'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notifications_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Notifiche Telegram
                        </FormLabel>
                        <FormDescription>
                          Ricevi notifiche per promemoria e scommesse in corso
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvataggio...' : 'Salva Configurazione'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      setIsTesting(true);
                      try {
                        const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
                          body: { message: 'Messaggio di test: notifiche Telegram attive ✅' },
                        });
                        if (error) throw error;
                        if (data?.success) {
                          toast.success('Messaggio di test inviato su Telegram');
                        } else {
                          toast.info('Richiesta inviata. Verifica Telegram.');
                        }
                      } catch (err: any) {
                        console.error('Test Telegram error:', err);
                        toast.error(err?.message || 'Invio test fallito. Controlla token e chat ID.');
                      } finally {
                        setIsTesting(false);
                      }
                    }}
                    disabled={isSubmitting || isTesting}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isTesting ? 'Invio...' : 'Invia messaggio di test'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {hasCredentials && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              ✅ BOT Telegram configurato correttamente! Riceverai notifiche personalizzate.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Canale Telegram</CardTitle>
            <CardDescription className="text-center">
              Inquadra il qrcode per accedere al canale telegram
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <img 
              src={telegramQR} 
              alt="QR Code Telegram" 
              className="max-w-xs w-full h-auto rounded-lg"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TelegramSettings;
