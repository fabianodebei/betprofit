import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Key, TestTube, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function OddsMatcherApiSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadApiKey();
  }, [user]);

  const loadApiKey = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_oddsmatcher_settings')
        .select('odds_api_key')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data?.odds_api_key) {
        setApiKey(data.odds_api_key);
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!apiKey.trim()) {
      toast({
        title: 'Errore',
        description: 'Inserisci una API key valida',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_oddsmatcher_settings')
        .upsert({
          user_id: user.id,
          odds_api_key: apiKey.trim(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: 'Successo',
        description: 'API key salvata correttamente',
      });
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: 'Errore',
        description: 'Errore nel salvataggio della API key',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'Errore',
        description: 'Inserisci una API key prima di testare',
        variant: 'destructive',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Test chiamando l'API direttamente
      const response = await fetch(
        `https://api.the-odds-api.com/v4/sports?apiKey=${apiKey.trim()}`
      );

      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          message: `Connessione riuscita! Trovati ${data.length} sport disponibili.`,
        });
      } else {
        const errorText = await response.text();
        setTestResult({
          success: false,
          message: `Errore ${response.status}: ${errorText || 'API key non valida'}`,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Errore di connessione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate('/impostazioni')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Torna alle Impostazioni
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">API Oddsmatcher</h1>
          <p className="mt-2 text-muted-foreground">
            Configura la tua API key per ricevere le quote in tempo reale
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              The Odds API
            </CardTitle>
            <CardDescription>
              Inserisci la tua API key personale da{' '}
              <a
                href="https://the-odds-api.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                the-odds-api.com
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Inserisci la tua API key"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {testResult && (
              <Alert variant={testResult.success ? 'default' : 'destructive'}>
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleTest}
                variant="outline"
                disabled={testing || !apiKey.trim()}
                className="flex-1"
              >
                <TestTube className="mr-2 h-4 w-4" />
                {testing ? 'Test in corso...' : 'Testa Connessione'}
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || !apiKey.trim()}
                className="flex-1"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Salvataggio...' : 'Salva'}
              </Button>
            </div>

            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">Come ottenere una API key:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Visita <a href="https://the-odds-api.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">the-odds-api.com</a></li>
                <li>Registrati per un account gratuito</li>
                <li>Copia la tua API key dal dashboard</li>
                <li>Incolla la chiave qui sopra e clicca "Testa Connessione"</li>
                <li>Una volta verificata, clicca "Salva"</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informazioni</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • La tua API key è personale e viene utilizzata per recuperare le quote in tempo reale
            </p>
            <p>
              • Il piano gratuito offre 500 richieste al mese
            </p>
            <p>
              • La chiave viene salvata in modo sicuro nel database
            </p>
            <p>
              • Se non configuri una API key personale, verrà utilizzata quella condivisa del progetto
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
