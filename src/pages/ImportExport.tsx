import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function ImportExport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);

  const handleExport = async () => {
    if (!user) return;
    
    setIsExporting(true);
    try {
      // Fetch all user data
      const [
        { data: accounts },
        { data: bets },
        { data: betLegs },
        { data: layBets },
        { data: books },
        { data: intestatari },
        { data: reminders },
        { data: tags },
        { data: transactions },
        { data: wallets }
      ] = await Promise.all([
        supabase.from('accounts').select('*').eq('user_id', user.id),
        supabase.from('bets').select('*').eq('user_id', user.id),
        supabase.from('bet_legs').select('*').eq('user_id', user.id),
        supabase.from('lay_bets').select('*').eq('user_id', user.id),
        supabase.from('books').select('*').eq('user_id', user.id),
        supabase.from('intestatari').select('*').eq('user_id', user.id),
        supabase.from('reminders').select('*').eq('user_id', user.id),
        supabase.from('tags').select('*').eq('user_id', user.id),
        supabase.from('transactions').select('*').eq('user_id', user.id),
        supabase.from('wallets').select('*').eq('user_id', user.id)
      ]);

      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {
          accounts: accounts || [],
          bets: bets || [],
          bet_legs: betLegs || [],
          lay_bets: layBets || [],
          books: books || [],
          intestatari: intestatari || [],
          reminders: reminders || [],
          tags: tags || [],
          transactions: transactions || [],
          wallets: wallets || []
        }
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `centurion-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Dati esportati con successo');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Errore durante l\'esportazione dei dati');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setImportPreview(data);
      } catch (error) {
        toast.error('File non valido. Assicurati di caricare un file JSON di export valido.');
        setImportFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!user || !importPreview) return;

    setIsImporting(true);
    try {
      const { data: importData } = importPreview;

      // Remove IDs and user_id from imported data, we'll let Supabase generate new ones
      const cleanData = (items: any[]) => 
        items.map(({ id, user_id, created_at, ...rest }) => ({ ...rest, user_id: user.id }));

      // Import data in batches
      const importPromises = [];

      if (importData.accounts?.length) {
        importPromises.push(
          supabase.from('accounts').insert(cleanData(importData.accounts))
        );
      }

      if (importData.books?.length) {
        importPromises.push(
          supabase.from('books').insert(cleanData(importData.books))
        );
      }

      if (importData.intestatari?.length) {
        importPromises.push(
          supabase.from('intestatari').insert(cleanData(importData.intestatari))
        );
      }

      if (importData.tags?.length) {
        importPromises.push(
          supabase.from('tags').insert(cleanData(importData.tags))
        );
      }

      if (importData.wallets?.length) {
        importPromises.push(
          supabase.from('wallets').insert(cleanData(importData.wallets))
        );
      }

      if (importData.bets?.length) {
        importPromises.push(
          supabase.from('bets').insert(cleanData(importData.bets))
        );
      }

      if (importData.bet_legs?.length) {
        importPromises.push(
          supabase.from('bet_legs').insert(cleanData(importData.bet_legs))
        );
      }

      if (importData.lay_bets?.length) {
        importPromises.push(
          supabase.from('lay_bets').insert(cleanData(importData.lay_bets))
        );
      }

      if (importData.reminders?.length) {
        importPromises.push(
          supabase.from('reminders').insert(cleanData(importData.reminders))
        );
      }

      if (importData.transactions?.length) {
        importPromises.push(
          supabase.from('transactions').insert(cleanData(importData.transactions))
        );
      }

      await Promise.all(importPromises);

      toast.success('Dati importati con successo');
      setImportFile(null);
      setImportPreview(null);
      
      // Refresh page to reload all contexts
      window.location.reload();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Errore durante l\'importazione dei dati');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-foreground">Import/Export Dati</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Esporta Dati</CardTitle>
                <CardDescription>Scarica tutti i tuoi dati in formato JSON</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                L'export include: conti, scommesse, transazioni, wallets, tags, books, intestatari e promemoria.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Esportazione...' : 'Esporta Tutti i Dati'}
            </Button>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Importa Dati</CardTitle>
                <CardDescription>Carica un file di export precedente</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Attenzione: l'import aggiungerà i dati a quelli esistenti senza sovrascriverli.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="import-file">File JSON di Export</Label>
              <Input 
                id="import-file"
                type="file" 
                accept=".json"
                onChange={handleFileSelect}
              />
            </div>

            {importPreview && (
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-sm font-semibold">Preview:</p>
                <div className="text-xs space-y-1">
                  <p>Accounts: {importPreview.data.accounts?.length || 0}</p>
                  <p>Bets: {importPreview.data.bets?.length || 0}</p>
                  <p>Bet Legs: {importPreview.data.bet_legs?.length || 0}</p>
                  <p>Lay Bets: {importPreview.data.lay_bets?.length || 0}</p>
                  <p>Books: {importPreview.data.books?.length || 0}</p>
                  <p>Intestatari: {importPreview.data.intestatari?.length || 0}</p>
                  <p>Reminders: {importPreview.data.reminders?.length || 0}</p>
                  <p>Tags: {importPreview.data.tags?.length || 0}</p>
                  <p>Transactions: {importPreview.data.transactions?.length || 0}</p>
                  <p>Wallets: {importPreview.data.wallets?.length || 0}</p>
                </div>
              </div>
            )}

            <Button 
              onClick={handleImport} 
              disabled={!importFile || isImporting}
              className="w-full"
              variant="secondary"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isImporting ? 'Importazione...' : 'Importa Dati'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Button variant="outline" onClick={() => navigate('/impostazioni')}>
          Torna alle Impostazioni
        </Button>
      </div>
    </div>
  );
}
