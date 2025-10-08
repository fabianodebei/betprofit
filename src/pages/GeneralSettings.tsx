import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function GeneralSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    standard: true,
    promemoria: false,
    singole: false,
    multiple: false,
    wallets: false,
    tag: false,
  });

  const handleSave = () => {
    // Qui salveresti le impostazioni nel database
    toast.success('Impostazioni salvate con successo');
  };

  const handleClose = () => {
    navigate('/impostazioni');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-foreground">Modifica le impostazioni</h1>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Standard */}
          <div className="flex items-start gap-4 pb-6 border-b">
            <div className="flex-shrink-0 pt-1">
              <Label htmlFor="standard" className="font-semibold text-base">Standard</Label>
              <Switch
                id="standard"
                checked={settings.standard}
                onCheckedChange={(checked) => setSettings({ ...settings, standard: checked })}
                className="mt-2"
              />
            </div>
            <div className="flex-1 bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Nella modalità <span className="font-semibold text-foreground">Standard</span> il profit tracker considera le movimentazioni e i saldi dei conti gioco. Disattivando la modalità <span className="font-semibold text-foreground">Standard</span>, potrai gestire le tue scommesse senza dover indicare depositi e prelievi effettuati sui conti gioco.
              </p>
            </div>
          </div>

          {/* Promemoria */}
          <div className="flex items-start gap-4 pb-6 border-b">
            <div className="flex-shrink-0 pt-1">
              <Label htmlFor="promemoria" className="font-semibold text-base">Promemoria</Label>
              <Switch
                id="promemoria"
                checked={settings.promemoria}
                onCheckedChange={(checked) => setSettings({ ...settings, promemoria: checked })}
                className="mt-2"
              />
            </div>
            <div className="flex-1 bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Abilita le notifiche tramite BOT telegram per i promemoria.
              </p>
            </div>
          </div>

          {/* Singole */}
          <div className="flex items-start gap-4 pb-6 border-b">
            <div className="flex-shrink-0 pt-1">
              <Label htmlFor="singole" className="font-semibold text-base">Singole</Label>
              <Switch
                id="singole"
                checked={settings.singole}
                onCheckedChange={(checked) => setSettings({ ...settings, singole: checked })}
                className="mt-2"
              />
            </div>
            <div className="flex-1 bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Abilita le notifiche tramite BOT telegram per le singole.
              </p>
            </div>
          </div>

          {/* Multiple */}
          <div className="flex items-start gap-4 pb-6 border-b">
            <div className="flex-shrink-0 pt-1">
              <Label htmlFor="multiple" className="font-semibold text-base">Multiple</Label>
              <Switch
                id="multiple"
                checked={settings.multiple}
                onCheckedChange={(checked) => setSettings({ ...settings, multiple: checked })}
                className="mt-2"
              />
            </div>
            <div className="flex-1 bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Abilita le notifiche tramite BOT telegram per le multiple.
              </p>
            </div>
          </div>

          {/* Wallets */}
          <div className="flex items-start gap-4 pb-6 border-b">
            <div className="flex-shrink-0 pt-1">
              <Label htmlFor="wallets" className="font-semibold text-base">Wallets</Label>
              <Switch
                id="wallets"
                checked={settings.wallets}
                onCheckedChange={(checked) => setSettings({ ...settings, wallets: checked })}
                className="mt-2"
              />
            </div>
            <div className="flex-1 bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Rende obbligatorio l'utilizzo dei wallet.
              </p>
            </div>
          </div>

          {/* Tag */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 pt-1">
              <Label htmlFor="tag" className="font-semibold text-base">Tag</Label>
              <Switch
                id="tag"
                checked={settings.tag}
                onCheckedChange={(checked) => setSettings({ ...settings, tag: checked })}
                className="mt-2"
              />
            </div>
            <div className="flex-1 bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Rende obbligatorio l'utilizzo dei tag.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-6">
            <Button variant="outline" onClick={handleClose}>
              Chiudi
            </Button>
            <Button onClick={handleSave}>
              Salva
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
