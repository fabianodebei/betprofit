import { useState } from 'react';
import { Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAccounts } from '@/contexts/AccountContext';
import { ALL_SPORT_MARKETS } from '@/constants/markets';
import { formatCurrency } from '@/utils/currency';
import { toast } from 'sonner';

interface Partita {
  id: string;
  data: Date | undefined;
  evento: string;
  mercato: string;
  quotaPunta: number;
  quotaBanca: number;
}

export function MatchedBettingCalculator() {
  const { accounts } = useAccounts();
  const availableBookmakers = accounts
    .filter(a => a.stato === 'Abilitato')
    .map(a => a.conto);

  const [bookmaker, setBookmaker] = useState<string>('');
  const [stakeBook, setStakeBook] = useState<number>(0);
  const [isFreeBet, setIsFreeBet] = useState(false);
  const [bonusBook, setBonusBook] = useState<number>(0);
  const [isRimborso, setIsRimborso] = useState(false);
  const [commissioni, setCommissioni] = useState<number>(4.5);
  const [partite, setPartite] = useState<Partita[]>([
    {
      id: '1',
      data: undefined,
      evento: '',
      mercato: '',
      quotaPunta: 0,
      quotaBanca: 0,
    },
  ]);
  const [openPartita, setOpenPartita] = useState<string>('1');
  const [risultati, setRisultati] = useState<{
    stakeBanca: number;
    guadagnoVincita: number;
    guadagnoPerdita: number;
  } | null>(null);

  const aggiungiPartita = () => {
    const nuovaId = (partite.length + 1).toString();
    setPartite([
      ...partite,
      {
        id: nuovaId,
        data: undefined,
        evento: '',
        mercato: '',
        quotaPunta: 0,
        quotaBanca: 0,
      },
    ]);
    setOpenPartita(nuovaId);
  };

  const rimuoviPartita = (id: string) => {
    if (partite.length === 1) {
      toast.error('Deve rimanere almeno una partita');
      return;
    }
    setPartite(partite.filter(p => p.id !== id));
  };

  const aggiornaPartita = (id: string, campo: keyof Partita, valore: any) => {
    setPartite(
      partite.map(p =>
        p.id === id ? { ...p, [campo]: valore } : p
      )
    );
  };

  const incrementaQuota = (id: string, campo: 'quotaPunta' | 'quotaBanca', delta: number) => {
    setPartite(
      partite.map(p =>
        p.id === id
          ? { ...p, [campo]: Math.max(1.01, Number((p[campo] + delta).toFixed(2))) }
          : p
      )
    );
  };

  const calcola = () => {
    // Calcola quota combinata multipla
    const quotaCombinata = partite.reduce((prod, p) => prod * p.quotaPunta, 1);
    
    // Calcola quota banca combinata
    const quotaBancaCombinata = partite.reduce((prod, p) => prod * p.quotaBanca, 1);

    // Stake effettivo (considera bonus e free bet)
    const stakeEffettivo = isFreeBet ? 0 : stakeBook;
    const stakeConBonus = stakeBook + bonusBook;

    // Calcola stake bancata per pareggiare
    const stakeBanca = (stakeConBonus * quotaCombinata) / quotaBancaCombinata;

    // Commissione sulla vincita della banca (in euro)
    const commissioneEuro = (stakeBanca * (commissioni / 100));

    // Scenario VINCITA puntata
    let vincitaPunta;
    if (isFreeBet) {
      // Free Bet: guadagno = stake * (quota - 1)
      vincitaPunta = stakeBook * (quotaCombinata - 1);
    } else {
      // Normale: profitto = stake * quota - stake
      vincitaPunta = stakeBook * quotaCombinata - stakeBook;
      if (bonusBook > 0) {
        // Con bonus: (stake + bonus) * quota - stake
        vincitaPunta = (stakeBook + bonusBook) * quotaCombinata - stakeBook;
      }
    }

    // Perdo la bancata (liability)
    const liabilityBanca = stakeBanca * (quotaBancaCombinata - 1);
    const guadagnoVincita = vincitaPunta - liabilityBanca;

    // Scenario PERDITA puntata
    let perditaPunta;
    if (isFreeBet) {
      perditaPunta = 0;
    } else {
      perditaPunta = -stakeBook + (isRimborso ? bonusBook : 0);
    }

    // Vinco la bancata (meno commissione)
    const vincitaBanca = stakeBanca - commissioneEuro;
    const guadagnoPerdita = perditaPunta + vincitaBanca;

    setRisultati({
      stakeBanca: Number(stakeBanca.toFixed(2)),
      guadagnoVincita: Number(guadagnoVincita.toFixed(2)),
      guadagnoPerdita: Number(guadagnoPerdita.toFixed(2)),
    });

    toast.success('Calcolo completato');
  };

  const pulisci = () => {
    setBookmaker('');
    setStakeBook(0);
    setIsFreeBet(false);
    setBonusBook(0);
    setIsRimborso(false);
    setCommissioni(4.5);
    setPartite([
      {
        id: '1',
        data: undefined,
        evento: '',
        mercato: '',
        quotaPunta: 0,
        quotaBanca: 0,
      },
    ]);
    setRisultati(null);
    toast.success('Campi puliti');
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-primary text-primary-foreground">
        <CardTitle className="text-center text-2xl">MULTIPLICATORE</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* Bookmaker */}
        <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
          <Label className="text-base font-semibold">Bookmaker</Label>
          <Select value={bookmaker} onValueChange={setBookmaker}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona" />
            </SelectTrigger>
            <SelectContent>
              {availableBookmakers.map(bm => (
                <SelectItem key={bm} value={bm}>
                  {bm}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stake Book */}
        <div className="grid grid-cols-[120px_1fr_auto] gap-4 items-center bg-secondary/50 p-3 rounded-lg">
          <Label className="text-base font-semibold">Stake Book</Label>
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              value={stakeBook || ''}
              onChange={e => setStakeBook(parseFloat(e.target.value) || 0)}
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="freeBet"
              checked={isFreeBet}
              onCheckedChange={checked => setIsFreeBet(!!checked)}
            />
            <Label htmlFor="freeBet" className="cursor-pointer">Free Bet</Label>
          </div>
        </div>

        {/* Bonus Book */}
        <div className="grid grid-cols-[120px_1fr_auto] gap-4 items-center bg-accent/20 p-3 rounded-lg">
          <Label className="text-base font-semibold">Bonus Book</Label>
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              value={bonusBook || ''}
              onChange={e => setBonusBook(parseFloat(e.target.value) || 0)}
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="rimborso"
              checked={isRimborso}
              onCheckedChange={checked => setIsRimborso(!!checked)}
            />
            <Label htmlFor="rimborso" className="cursor-pointer">Rimborso</Label>
          </div>
        </div>

        {/* Pulsante Aggiungi */}
        <div className="flex justify-center border-t pt-4">
          <Button onClick={aggiungiPartita} variant="outline" size="icon">
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Lista Partite */}
        <div className="space-y-3">
          {partite.map((partita, index) => (
            <Collapsible
              key={partita.id}
              open={openPartita === partita.id}
              onOpenChange={() =>
                setOpenPartita(openPartita === partita.id ? '' : partita.id)
              }
            >
              <div className="bg-muted/50 rounded-lg overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/70 transition-colors">
                  <span className="font-semibold text-lg">PARTITA {index + 1}</span>
                  {openPartita === partita.id ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 space-y-4 bg-background/50">
                    {/* Data */}
                    <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                      <Label>Data</Label>
                      <Input
                        type="datetime-local"
                        value={
                          partita.data
                            ? new Date(partita.data.getTime() - partita.data.getTimezoneOffset() * 60000)
                                .toISOString()
                                .slice(0, 16)
                            : ''
                        }
                        onChange={e =>
                          aggiornaPartita(
                            partita.id,
                            'data',
                            e.target.value ? new Date(e.target.value) : undefined
                          )
                        }
                      />
                    </div>

                    {/* Evento */}
                    <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                      <Label>Evento</Label>
                      <Input
                        placeholder="Evento"
                        value={partita.evento}
                        onChange={e => aggiornaPartita(partita.id, 'evento', e.target.value)}
                      />
                    </div>

                    {/* Mercato */}
                    <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                      <Label>Mercato</Label>
                      <Select
                        value={partita.mercato}
                        onValueChange={value => aggiornaPartita(partita.id, 'mercato', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_SPORT_MARKETS.map(m => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quota Punta */}
                    <div className="grid grid-cols-[120px_1fr_auto] gap-4 items-center bg-info/10 p-2 rounded">
                      <Label className="font-semibold">Quota Punta</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={partita.quotaPunta || ''}
                        onChange={e =>
                          aggiornaPartita(partita.id, 'quotaPunta', parseFloat(e.target.value) || 0)
                        }
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => incrementaQuota(partita.id, 'quotaPunta', 0.01)}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => incrementaQuota(partita.id, 'quotaPunta', -0.01)}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Quota Banca */}
                    <div className="grid grid-cols-[120px_1fr_auto] gap-4 items-center bg-destructive/10 p-2 rounded">
                      <Label className="font-semibold">Quota Banca</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={partita.quotaBanca || ''}
                        onChange={e =>
                          aggiornaPartita(partita.id, 'quotaBanca', parseFloat(e.target.value) || 0)
                        }
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => incrementaQuota(partita.id, 'quotaBanca', 0.01)}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => incrementaQuota(partita.id, 'quotaBanca', -0.01)}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Pulsante Rimuovi */}
                    {partite.length > 1 && (
                      <div className="flex justify-end pt-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => rimuoviPartita(partita.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Rimuovi Partita
                        </Button>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>

        {/* Commissioni */}
        <div className="grid grid-cols-[120px_1fr] gap-4 items-center bg-destructive/10 p-3 rounded-lg border-t pt-4">
          <Label className="text-base font-semibold">Commissioni</Label>
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              value={commissioni || ''}
              onChange={e => setCommissioni(parseFloat(e.target.value) || 0)}
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
        </div>

        {/* Pulsanti Azione */}
        <div className="flex gap-3 pt-4">
          <Button onClick={calcola} variant="outline" className="flex-1">
            CALCOLA →
          </Button>
          <Button onClick={pulisci} variant="destructive" className="flex-1">
            PULISCI 🗑
          </Button>
        </div>

        {/* Risultati */}
        {risultati && (
          <div className="space-y-3 border-t pt-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">RISULTATI</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Stake Bancata:</span>
                  <span className="font-bold">{formatCurrency(risultati.stakeBanca)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Guadagno se VINCI:</span>
                  <span
                    className={`font-bold ${
                      risultati.guadagnoVincita >= 0 ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {formatCurrency(risultati.guadagnoVincita)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Guadagno se PERDI:</span>
                  <span
                    className={`font-bold ${
                      risultati.guadagnoPerdita >= 0 ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {formatCurrency(risultati.guadagnoPerdita)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
