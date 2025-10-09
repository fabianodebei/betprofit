import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { UserPlus, MessageSquare, Bot, Bell, CheckCircle2, ArrowRight, Info, Smartphone, Search, Send, Copy, Settings } from 'lucide-react';
const SetupGuide = () => {
  const navigate = useNavigate();
  return <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Guida Setup Multi-Tenant</h1>
        <p className="text-lg text-muted-foreground">
          Segui questa guida per configurare il tuo account personale e ricevere notifiche Telegram
        </p>
      </div>

      {/* Step 1: Registrazione */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Passo 1: Registrazione Account</CardTitle>
              <CardDescription>Crea il tuo account personale gratuito</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              Come registrarsi
            </h4>
            <ol className="list-decimal ml-6 space-y-2 text-sm">
              <li>Vai alla pagina di login/registrazione</li>
              <li>Clicca sulla tab "Registrati"</li>
              <li>Inserisci:
                <ul className="list-disc ml-6 mt-1">
                  <li><strong>Nome completo</strong>: Il tuo nome e cognome</li>
                  <li><strong>Email</strong>: Una email valida (sarà il tuo username)</li>
                  <li><strong>Password</strong>: Minimo 6 caratteri</li>
                </ul>
              </li>
              <li>Clicca "Crea Account"</li>
            </ol>
          </div>

          

          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Email Automatica:</strong> La conferma email è automatica! Non devi verificare 
              la tua email, puoi iniziare subito a usare l&apos;app.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Step 2: Configurazione Telegram */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Passo 2: Configurazione BOT Telegram (Opzionale)</CardTitle>
              <CardDescription>Ricevi notifiche personalizzate sul tuo Telegram</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Substep 2.1: Creare il BOT */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              2.1 - Creare il tuo BOT Telegram
            </h4>
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <ol className="list-decimal ml-6 space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="flex-1">
                    <strong>Apri Telegram</strong> sul tuo smartphone o desktop
                  </span>
                  <Smartphone className="h-4 w-4 text-muted-foreground mt-1" />
                </li>
                
                <li className="flex items-start gap-2">
                  <span className="flex-1">
                    <strong>Cerca @BotFather</strong> nella barra di ricerca
                  </span>
                  <Search className="h-4 w-4 text-muted-foreground mt-1" />
                </li>
                
                <li>
                  <strong>Avvia una conversazione</strong> cliccando "Start"
                </li>
                
                <li className="space-y-2">
                  <strong>Invia il comando:</strong>
                  <div className="flex items-center gap-2 bg-background p-2 rounded border">
                    <code className="flex-1">/newbot</code>
                    <Button size="sm" variant="ghost" className="h-6">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </li>
                
                <li>
                  <strong>Scegli un nome</strong> per il tuo BOT (es: "MioBetTracker")
                </li>
                
                <li>
                  <strong>Scegli uno username</strong> che finisca con "bot" (es: "mio_bettracker_bot")
                </li>
                
                <li className="space-y-2">
                  <strong>Riceverai il TOKEN del BOT</strong> - salvalo!
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Il token avrà questo formato: <code>1234567890:ABCdefGHIjklMNOpqrsTUVwxyz</code>
                    </AlertDescription>
                  </Alert>
                </li>
              </ol>
            </div>
          </div>

          {/* Substep 2.2: Ottenere Chat ID */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              2.2 - Ottenere il tuo Chat ID
            </h4>
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <ol className="list-decimal ml-6 space-y-3 text-sm">
                <li>
                  <strong>Cerca il tuo BOT</strong> appena creato su Telegram e clicca "Start"
                </li>
                
                <li className="flex items-start gap-2">
                  <span className="flex-1">
                    <strong>Cerca @userinfobot</strong> su Telegram
                  </span>
                  <Search className="h-4 w-4 text-muted-foreground mt-1" />
                </li>
                
                <li className="space-y-2">
                  <strong>Invia il comando:</strong>
                  <div className="flex items-center gap-2 bg-background p-2 rounded border">
                    <code className="flex-1">/start</code>
                    <Button size="sm" variant="ghost" className="h-6">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </li>
                
                <li>
                  <strong>Riceverai il tuo Chat ID</strong> - salvalo! Sarà un numero come: 123456789
                </li>
              </ol>
            </div>
          </div>

          {/* Substep 2.3: Configurare nell'app */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              2.3 - Inserire le credenziali nell&apos;app
            </h4>
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <ol className="list-decimal ml-6 space-y-3 text-sm">
                <li>
                  Vai in <strong>Impostazioni → Telegram</strong>
                </li>
                
                <li>
                  Incolla il <strong>BOT Token</strong> che hai ricevuto da @BotFather
                </li>
                
                <li>
                  Incolla il tuo <strong>Chat ID</strong> che hai ricevuto da @userinfobot
                </li>
                
                <li>
                  Assicurati che <strong>Notifiche Telegram</strong> sia attivo (interruttore verde)
                </li>
                
                <li>
                  Clicca <strong>"Salva Configurazione"</strong>
                </li>
              </ol>
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Quando riceverò le notifiche?</strong><br />
              Riceverai notifiche Telegram per:
              <ul className="list-disc ml-6 mt-2">
                <li><strong>Promemoria in scadenza</strong> (secondo il periodo impostato)</li>
                <li><strong>Scommesse concluse</strong> (1h 40min dopo l&apos;inizio dell&apos;evento)</li>
                <li><strong>Multipla completata</strong> (reminder per bancare la prossima scommessa)</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Step 3: Iniziare a usare */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Passo 3: Inizia a Usare l&apos;App</CardTitle>
              <CardDescription>Tutto pronto! Ora puoi gestire le tue scommesse</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-semibold">Crea Intestatari</h4>
              <p className="text-sm text-muted-foreground">
                Vai in <strong>Impostazioni → Intestatari</strong> per creare i profili 
                a cui intestare conti e portafogli
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-semibold">Aggiungi Conti</h4>
              <p className="text-sm text-muted-foreground">
                Vai in <strong>Conti</strong> per aggiungere i tuoi account bookmaker 
                e iniziare a tracciare le scommesse
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-semibold">Registra Scommesse</h4>
              <p className="text-sm text-muted-foreground">
                Vai in <strong>Puntate</strong> per registrare le tue scommesse singole, 
                multiple o casino
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-semibold">Monitora Dashboard</h4>
              <p className="text-sm text-muted-foreground">
                La <strong>Dashboard</strong> ti mostra in tempo reale i tuoi profitti, 
                statistiche e trend mensili
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy e Sicurezza */}
      <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-600/10 p-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-green-800 dark:text-green-200">
                Privacy e Sicurezza
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">
                I tuoi dati sono al sicuro
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-green-800 dark:text-green-200">
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400" />
              <span>
                <strong>Dati Isolati:</strong> Ogni utente vede solo i propri dati. 
                Sistema multi-tenant con Row Level Security (RLS).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400" />
              <span>
                <strong>Telegram Personale:</strong> Le tue credenziali Telegram sono 
                criptate e usate solo per inviarti notifiche.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400" />
              <span>
                <strong>Password Sicure:</strong> Le password sono hash con algoritmi sicuri. 
                Nessuno può vedere la tua password, nemmeno gli admin.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400" />
              <span>
                <strong>Backup Automatici:</strong> I tuoi dati sono salvati in backup 
                automatici giornalieri.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* CTA Buttons */}
      <div className="flex gap-4 justify-center">
        <Button size="lg" onClick={() => navigate('/auth')}>
          <UserPlus className="mr-2 h-5 w-5" />
          Inizia Ora - È Gratis
        </Button>
        <Button size="lg" variant="outline" onClick={() => navigate('/impostazioni/telegram')}>
          <MessageSquare className="mr-2 h-5 w-5" />
          Configura Telegram
        </Button>
      </div>
    </div>;
};
export default SetupGuide;