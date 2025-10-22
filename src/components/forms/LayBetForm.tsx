import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { CalendarIcon, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { checkMarketCompatibility } from '@/utils/accaCalculations';
import { format } from 'date-fns';
import { formatDate } from '@/utils/dates';
import { cn } from '@/lib/utils';
import { useLayBets } from '@/contexts/LayBetContext';
import { useAccounts } from '@/contexts/AccountContext';
import { useBets } from '@/contexts/BetContext';
import { useBetLegs } from '@/contexts/BetLegContext';
import { SPORT_MARKETS } from '@/constants/markets';
import { LayBet, Bet } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const layBetSchema = z.object({
  metodo: z.enum(['Punta', 'Banca']),
  evento: z.string().min(1, 'Evento è obbligatorio'),
  dataEvento: z.date(),
  mercato: z.string().min(1, 'Mercato è obbligatorio'),
  conto: z.string().min(1, 'Conto è obbligatorio'),
  stake: z.number().positive('Lo stake deve essere positivo'),
  quotaBanca: z.number().min(1.01, 'La quota banca deve essere almeno 1.01'),
  quotaPunta: z.number().min(1.01, 'La quota punta deve essere almeno 1.01'),
  tassePercentuale: z.number().min(0).max(100),
  urlEvento: z.string().optional(),
});

type LayBetFormData = z.infer<typeof layBetSchema>;

interface LayBetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentBetId?: string;
  editingLayBet?: LayBet | null;
  mode?: 'create' | 'edit';
  parentBet?: any; // Bet principale per pre-compilare i dati
  betLegs?: any[]; // Selezioni della multipla
}

export function LayBetForm({ open, onOpenChange, parentBetId, editingLayBet, mode = 'create', parentBet, betLegs = [] }: LayBetFormProps) {
  const { addLayBet, updateLayBet } = useLayBets();
  const { accounts, updateAccount } = useAccounts();
  const { getOngoingBets } = useBets();
  const { getBetLegsByBetId } = useBetLegs();
  const [selectedMetodo, setSelectedMetodo] = useState<'Punta' | 'Banca'>('Punta');
  const [selectedBetLeg, setSelectedBetLeg] = useState<any>(null);
  const [selectedParentBetId, setSelectedParentBetId] = useState<string>(parentBetId || '');
  const [selectedParentBet, setSelectedParentBet] = useState<Bet | null>(parentBet || null);
  const [dynamicBetLegs, setDynamicBetLegs] = useState<any[]>([]);
  
  // Sincronizza la selezione della multipla quando il form viene aperto dal dettaglio multipla
  useEffect(() => {
    if (open && parentBetId && parentBet) {
      setSelectedParentBetId(parentBetId);
      setSelectedParentBet(parentBet);
    }
  }, [open, parentBetId, parentBet]);
  
  const ongoingBets = getOngoingBets();
  
  // Usa betLegs passati come prop o quelli caricati dinamicamente
  const effectiveBetLegs = betLegs.length > 0 ? betLegs : dynamicBetLegs;

  const form = useForm<LayBetFormData>({
    resolver: zodResolver(layBetSchema),
    defaultValues: {
      metodo: 'Punta',
      evento: '',
      dataEvento: new Date(),
      mercato: '',
      conto: '',
      stake: 0,
      quotaBanca: 1.01,
      quotaPunta: 1.01,
      tassePercentuale: 0,
      urlEvento: '',
    },
  });

  // Verifica compatibilità mercato (dopo form.watch disponibile)
  const mercato = form.watch('mercato');
  const marketCompatibility = useMemo(() => {
    if (!selectedBetLeg?.selezione || !mercato) return { compatible: true };
    return checkMarketCompatibility(selectedBetLeg.selezione, mercato);
  }, [selectedBetLeg, mercato]);

  // Carica bet legs quando viene selezionata una multipla
  useEffect(() => {
    if (selectedParentBet?.tipo === 'Multipla' && selectedParentBetId) {
      const legs = getBetLegsByBetId(selectedParentBetId);
      console.log('Loading bet legs for multipla:', selectedParentBetId, 'legs:', legs);
      setDynamicBetLegs(legs || []);
    } else {
      setDynamicBetLegs([]);
    }
  }, [selectedParentBet, selectedParentBetId, getBetLegsByBetId]);

  // Debug: log effectiveBetLegs
  useEffect(() => {
    console.log('effectiveBetLegs:', effectiveBetLegs, 'betLegs prop:', betLegs, 'dynamicBetLegs:', dynamicBetLegs);
  }, [effectiveBetLegs, betLegs, dynamicBetLegs]);

  useEffect(() => {
    if (editingLayBet && open) {
      form.reset({
        metodo: editingLayBet.metodo,
        evento: editingLayBet.evento,
        dataEvento: new Date(editingLayBet.dataEvento),
        mercato: editingLayBet.mercato,
        conto: editingLayBet.conto,
        stake: editingLayBet.stake,
        quotaBanca: editingLayBet.quotaBanca,
        quotaPunta: editingLayBet.quotaPunta,
        tassePercentuale: editingLayBet.tassePercentuale,
        urlEvento: editingLayBet.urlEvento || '',
      });
      setSelectedMetodo(editingLayBet.metodo);
    } else if (!editingLayBet && open && parentBet) {
      // Pre-compila con i dati della bet principale
      // Se è una multipla, usa i dati della prima selezione
      const firstLeg = betLegs.length > 0 ? betLegs[0] : null;
      
      form.reset({
        metodo: 'Banca',
        evento: firstLeg?.evento || parentBet.evento || '',
        dataEvento: new Date(firstLeg?.dataEvento || parentBet.dataEvento),
        mercato: firstLeg?.mercato || parentBet.mercato || '',
        conto: '',
        stake: 0,
        quotaBanca: 1.01,
        quotaPunta: firstLeg?.quota || parentBet.quota || 1.01,
        tassePercentuale: 0,
        urlEvento: parentBet.urlEvento || '',
      });
      setSelectedMetodo('Banca');
      if (firstLeg) setSelectedBetLeg(firstLeg);
    } else if (!editingLayBet && open) {
      form.reset({
        metodo: 'Punta',
        evento: '',
        dataEvento: new Date(),
        mercato: '',
        conto: '',
        stake: 0,
        quotaBanca: 1.01,
        quotaPunta: 1.01,
        tassePercentuale: 0,
        urlEvento: '',
      });
      setSelectedMetodo('Punta');
    }
  }, [editingLayBet, open, form, parentBet]);

  const onSubmit = async (data: LayBetFormData) => {
    // Ricarica account fresco dal database per avere saldo aggiornato
    const { data: freshAccounts } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('conto', data.conto)
      .single();
    
    const account = freshAccounts || accounts.find(a => a.conto === data.conto);
    
    // Controllo saldo per LayBet
    if (account) {
      const saldo = 'saldo_attuale' in account ? Number((account as any).saldo_attuale) : (account as any).saldoAttuale;
      const bg = 'bilancio_giocate' in account ? Number((account as any).bilancio_giocate) : (account as any).bilancioGiocate;
      const br = 'bilancio_giocate_rapide' in account ? Number((account as any).bilancio_giocate_rapide) : (account as any).bilancioGiocateRapide;
      const disponibile = (saldo || 0) + (bg || 0) + (br || 0);

      if (data.metodo === 'Punta') {
        // Per puntate normali, lo stake non deve superare il disponibile
        if (data.stake > disponibile) {
          form.setError('stake', {
            type: 'manual',
            message: `Saldo insufficiente! Disponibile: €${disponibile.toFixed(2)}, Richiesto: €${data.stake.toFixed(2)}`
          });
          return;
        }
      } else if (data.metodo === 'Banca') {
        // Per bancate, la liability (responsabilità) non deve superare il disponibile
        const liability = data.stake * (data.quotaBanca - 1);
        if (liability > disponibile) {
          form.setError('stake', {
            type: 'manual',
            message: `Saldo insufficiente per la liability! Disponibile: €${disponibile.toFixed(2)}, Liability richiesta: €${liability.toFixed(2)}`
          });
          return;
        }
      }
    }
    
    if (mode === 'edit' && editingLayBet) {
      await updateLayBet(editingLayBet.id, {
        metodo: data.metodo,
        evento: data.evento,
        dataEvento: data.dataEvento,
        mercato: data.mercato,
        conto: data.conto,
        stake: data.stake,
        quotaBanca: data.quotaBanca,
        quotaPunta: data.quotaPunta,
        tassePercentuale: data.tassePercentuale,
        urlEvento: data.urlEvento,
      });
    } else {
      const betId = selectedParentBetId || parentBetId;
      if (!betId) {
        form.setError('evento', { message: 'Seleziona una partita da bancare' });
        return;
      }
      
      // Nessuna modifica diretta al saldo: il controllo è già stato effettuato sul disponibile (saldo + bilanci) e i bilanci verranno ricalcolati automaticamente
      
      await addLayBet({
        parentBetId: betId,
        metodo: data.metodo,
        evento: data.evento,
        dataEvento: data.dataEvento,
        mercato: data.mercato,
        conto: data.conto,
        stake: data.stake,
        quotaBanca: data.quotaBanca,
        quotaPunta: data.quotaPunta,
        tassePercentuale: data.tassePercentuale,
        urlEvento: data.urlEvento,
      });
    }

    form.reset();
    setSelectedParentBetId('');
    setSelectedParentBet(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Modifica Bancata' : 'Nuova Bancata'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="metodo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metodo *</FormLabel>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={field.value === 'Punta' ? 'default' : 'outline'}
                      onClick={() => {
                        field.onChange('Punta');
                        setSelectedMetodo('Punta');
                      }}
                      className="flex-1"
                    >
                      Punta
                    </Button>
                    <Button
                      type="button"
                      variant={field.value === 'Banca' ? 'default' : 'outline'}
                      onClick={() => {
                        field.onChange('Banca');
                        setSelectedMetodo('Banca');
                      }}
                      className="flex-1"
                    >
                      Banca
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {(parentBet?.tipo === 'Multipla' || selectedParentBet?.tipo === 'Multipla') && (
              <>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Partite disponibili: {effectiveBetLegs.length}
                    {effectiveBetLegs.length === 0 && ' - Caricamento...'}
                  </p>
                </div>
                
                {effectiveBetLegs.length > 0 ? (
                  <FormField
                    control={form.control}
                    name="evento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seleziona Partita della Multipla da Bancare *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            const leg = effectiveBetLegs.find(l => l.id === value);
                            if (leg) {
                              setSelectedBetLeg(leg);
                              form.setValue('evento', leg.evento);
                              form.setValue('dataEvento', new Date(leg.dataEvento));
                              // Suggerisci mercato corretto
                              const suggestedMarket = `Esito Finale - ${leg.selezione || leg.mercato}`;
                              form.setValue('mercato', suggestedMarket);
                              form.setValue('quotaPunta', leg.quota);
                            }
                          }}
                          defaultValue={selectedBetLeg?.id}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona partita da bancare" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {effectiveBetLegs.map((leg) => (
                              <SelectItem key={leg.id} value={leg.id}>
                                {leg.evento} - {leg.selezione || leg.mercato} @ {leg.quota?.toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    Questa multipla non ha partite salvate. Non è possibile bancarla.
                  </div>
                )}

                {/* Warning se mercato incompatibile */}
                {!marketCompatibility.compatible && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Attenzione:</strong> {marketCompatibility.warning}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
            
            {effectiveBetLegs.length === 0 && (
              <FormField
                control={form.control}
                name="evento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evento *</FormLabel>
                    <FormControl>
                      <Input placeholder="Es: Roma vs Lazio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="dataEvento"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Evento *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'dd/MM/yyyy HH:mm') : <span>Seleziona data</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3 border-b">
                        <TimePicker value={field.value} onChange={field.onChange} />
                      </div>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mercato"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mercato *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona mercato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      {Object.entries(SPORT_MARKETS).map(([categoria, mercati]) => (
                        <div key={categoria}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                            {categoria}
                          </div>
                          {mercati.map((mercato) => (
                            <SelectItem key={mercato} value={mercato}>
                              {mercato}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="conto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conto *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona conto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts
                        .filter(account => account.stato === 'Abilitato')
                        .map((account) => (
                          <SelectItem key={account.id} value={account.conto}>
                            {account.conto} - {account.intestatario}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stake"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stake *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedMetodo === 'Banca' ? (
              <FormField
                control={form.control}
                name="quotaBanca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quota Exchange *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 1.01)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="quotaPunta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quota *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 1.01)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="tassePercentuale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tasse % *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="urlEvento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Evento</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annulla
              </Button>
              <Button type="submit">
                {mode === 'edit' ? 'Salva Modifiche' : 'Aggiungi Bancata'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
