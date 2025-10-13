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
import { Info, MessageSquare, ArrowLeft } from 'lucide-react';

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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      telegram_bot_token: '',
      telegram_chat_id: '',
      notifications_enabled: true,
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        telegram_bot_token: config.telegram_bot_token || '',
        telegram_chat_id: config.telegram_chat_id || '',
        notifications_enabled: config.notifications_enabled ?? true,
      });
    }
  }, [config, form]);

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await updateConfig(data);
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Configurazione Telegram
          </h1>
          <p className="text-muted-foreground mt-2">
            Configura il tuo BOT Telegram personale per ricevere notifiche
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/impostazioni')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alle Impostazioni
        </Button>
      </div>

      <div className="grid gap-6 max-w-2xl mx-auto">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Come configurare il tuo BOT Telegram:</strong>
            <ol className="list-decimal ml-4 mt-2 space-y-1">
              <li>Apri Telegram e cerca <code className="bg-muted px-1 rounded">@BotFather</code></li>
              <li>Invia il comando <code className="bg-muted px-1 rounded">/newbot</code> e segui le istruzioni</li>
              <li>Copia il token che ricevi e incollalo qui sotto</li>
              <li>Avvia una conversazione con il tuo nuovo BOT</li>
              <li>Per ottenere il Chat ID, cerca <code className="bg-muted px-1 rounded">@userinfobot</code> su Telegram e invia <code className="bg-muted px-1 rounded">/start</code></li>
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
                          placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Il token fornito da @BotFather
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
                          placeholder="123456789"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Il tuo Chat ID personale (ottienilo da @userinfobot)
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

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvataggio...' : 'Salva Configurazione'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {config?.telegram_bot_token && config?.telegram_chat_id && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              ✅ BOT Telegram configurato correttamente! Riceverai notifiche personalizzate.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default TelegramSettings;
