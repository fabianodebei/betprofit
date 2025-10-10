import { useState, useEffect } from 'react';
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
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useBets } from '@/contexts/BetContext';
import { useBetLegs } from '@/contexts/BetLegContext';
import { useAccounts } from '@/contexts/AccountContext';
import { useTags } from '@/contexts/TagContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useWallets } from '@/contexts/WalletContext';
import { useIntestatari } from '@/contexts/IntestatariContext';
import { PREDEFINED_TAGS } from '@/constants/predefinedTags';
import { ALL_SPORT_MARKETS, CASINO_MARKETS } from '@/constants/markets';
import { Bet, BetLeg } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface BetSelection {
  evento: string;
  competizione: string;
  mercato: string;
  selezione: string;
  quota: number;
  dataEvento: Date;
}

const createMultiplaBetSchema = (tagRequired: boolean) => z.object({
  intestatario: z.string().min(1, 'Intestatario è obbligatorio'),
  dataEvento: z.date(),
  conto: z.string().min(1, 'Conto è obbligatorio'),
  stake: z.number().positive('Lo stake deve essere positivo'),
  tipoBonus: z.enum(['Nessuno', 'Bonus Multipla', 'Rimborso Multipla', 'Free Bet Multipla', 'Assicurazione Multipla']),
  percentualeBonus: z.number().optional(),
  numeroMinimoSelezioni: z.number().optional(),
  bonus: z.number().optional(),
  rimborso: z.number().optional(),
  urlEvento: z.string().optional(),
  note: z.string().optional(),
  tag: tagRequired 
    ? z.string().min(1, 'Tag è obbligatorio').refine(val => val !== 'none', 'Seleziona un tag valido')
    : z.string().optional(),
});

type MultiplaBetFormData = z.infer<ReturnType<typeof createMultiplaBetSchema>>;

interface MultiplaBetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBet?: Bet | null;
  mode?: 'create' | 'edit' | 'clone';
}

export function MultiplaBetForm({ open, onOpenChange, editingBet, mode = 'create' }: MultiplaBetFormProps) {
  const { addBet, updateBet } = useBets();
  const { addBetLeg, getBetLegsByBetId } = useBetLegs();
  const { accounts, updateAccount } = useAccounts();
  const { tags } = useTags();
  const { settings } = useSettings();
  const { wallets } = useWallets();
  const { intestatari } = useIntestatari();
  const [selectedIntestatario, setSelectedIntestatario] = useState<string>('');
  const [selectedConto, setSelectedConto] = useState<string>('');
  const [tipoBonus, setTipoBonus] = useState<Bet['tipoBonus']>('Nessuno');
  
  // State for bet selections
  const [selections, setSelections] = useState<BetSelection[]>([
    {
      evento: '',
      competizione: '',
      mercato: '',
      selezione: '',
      quota: 1.5,
      dataEvento: new Date(),
    },
    {
      evento: '',
      competizione: '',
      mercato: '',
      selezione: '',
      quota: 1.5,
      dataEvento: new Date(),
    },
  ]);

  const multiplaBetSchema = createMultiplaBetSchema(settings.tag);

  const form = useForm<MultiplaBetFormData>({
    resolver: zodResolver(multiplaBetSchema),
    defaultValues: {
      intestatario: '',
      dataEvento: new Date(),
      conto: '',
      stake: 0,
      tipoBonus: 'Nessuno',
      percentualeBonus: 0,
      numeroMinimoSelezioni: 2,
      bonus: 0,
      rimborso: 0,
      urlEvento: '',
      note: '',
      tag: 'none',
    },
  });

  const selectedAccount = accounts.find(a => a.conto === selectedConto);
  const selectedWallet = selectedAccount?.walletId 
    ? wallets.find(w => w.id === selectedAccount.walletId) 
    : null;

  const availableIntestatari = intestatari.filter(int => int.stato === 'Abilitato');

  // Calculate combined odds
  const quotaCombinata = selections.reduce((acc, sel) => acc * sel.quota, 1);
  const vincitaPotenziale = form.watch('stake') * quotaCombinata;

  useEffect(() => {
    if (editingBet && open) {
      const account = accounts.find(a => a.conto === editingBet.conto);
      const intestatario = account?.intestatario || '';
      
      const bonusTypes = ['Nessuno', 'Bonus Multipla', 'Rimborso Multipla', 'Free Bet Multipla', 'Assicurazione Multipla'];
      const validBonus = bonusTypes.includes(editingBet.tipoBonus || 'Nessuno') ? editingBet.tipoBonus : 'Nessuno';
      
      form.reset({
        intestatario: intestatario,
        dataEvento: new Date(editingBet.dataEvento),
        conto: editingBet.conto,
        stake: editingBet.stake,
        tipoBonus: validBonus as any,
        percentualeBonus: editingBet.percentualeBonus || 0,
        numeroMinimoSelezioni: editingBet.numeroMinimoSelezioni || 2,
        bonus: editingBet.bonus || 0,
        rimborso: editingBet.rimborso || 0,
        urlEvento: editingBet.urlEvento || '',
        note: editingBet.note || '',
        tag: editingBet.tag || 'none',
      });
      setSelectedIntestatario(intestatario);
      setSelectedConto(editingBet.conto);
      setTipoBonus(validBonus as any);

      // Load existing bet legs if editing
      if (mode === 'edit') {
        const existingLegs = getBetLegsByBetId(editingBet.id);
        if (existingLegs.length > 0) {
          setSelections(existingLegs.map(leg => ({
            evento: leg.evento,
            competizione: leg.competizione || '',
            mercato: leg.mercato || '',
            selezione: leg.selezione,
            quota: leg.quota,
            dataEvento: new Date(leg.dataEvento),
          })));
        }
      }
    } else if (!editingBet && open) {
      const predefinito = intestatari.find(int => int.predefinito && int.stato === 'Abilitato');
      if (predefinito) {
        form.setValue('intestatario', predefinito.nome);
        setSelectedIntestatario(predefinito.nome);
      } else {
        form.reset();
        setSelectedIntestatario('');
        setSelectedConto('');
        setTipoBonus('Nessuno');
      }
      // Reset selections to default
      setSelections([
        { evento: '', competizione: '', mercato: '', selezione: '', quota: 1.5, dataEvento: new Date() },
        { evento: '', competizione: '', mercato: '', selezione: '', quota: 1.5, dataEvento: new Date() },
      ]);
    }
  }, [editingBet, open, intestatari, accounts, mode]);

  const handleAddSelection = () => {
    if (selections.length >= 10) {
      toast.error('Massimo 10 selezioni per multipla');
      return;
    }
    setSelections([...selections, {
      evento: '',
      competizione: '',
      mercato: '',
      selezione: '',
      quota: 1.5,
      dataEvento: new Date(),
    }]);
  };

  const handleRemoveSelection = (index: number) => {
    if (selections.length <= 2) {
      toast.error('Minimo 2 selezioni per una multipla');
      return;
    }
    setSelections(selections.filter((_, i) => i !== index));
  };

  const handleSelectionChange = (index: number, field: keyof BetSelection, value: any) => {
    const newSelections = [...selections];
    newSelections[index] = { ...newSelections[index], [field]: value };
    setSelections(newSelections);
  };

  const onSubmit = async (data: MultiplaBetFormData) => {
    try {
      // Validate selections
      const invalidSelection = selections.find(s => !s.evento || !s.selezione || s.quota <= 1);
      if (invalidSelection) {
        toast.error('Compila tutti i campi delle selezioni e assicurati che le quote siano superiori a 1');
        return;
      }

      if (quotaCombinata > 50) {
        toast.warning('Attenzione: quota combinata molto alta (@' + quotaCombinata.toFixed(2) + ')');
      }

      const account = accounts.find(a => a.conto === data.conto);
      if (!account) {
        toast.error('Conto non trovato');
        return;
      }

      if (mode === 'edit' && editingBet) {
        await updateBet(editingBet.id, {
          ...editingBet,
          conto: data.conto,
          stake: data.stake,
          dataEvento: data.dataEvento,
          tipoBonus: data.tipoBonus,
          percentualeBonus: data.percentualeBonus,
          numeroMinimoSelezioni: data.numeroMinimoSelezioni,
          bonus: data.bonus || 0,
          rimborso: data.rimborso || 0,
          urlEvento: data.urlEvento,
          note: data.note,
          tag: data.tag === 'none' ? undefined : data.tag,
          quotaCombinata: quotaCombinata,
          vincitaPotenziale: vincitaPotenziale,
        });

        toast.success('Multipla aggiornata');
      } else {
        await addBet({
          tipo: 'Multipla',
          conto: data.conto,
          stake: data.stake,
          evento: selections.map(s => s.selezione).join(', '),
          dataEvento: data.dataEvento,
          stato: 'In Corso',
          tipoBonus: data.tipoBonus,
          percentualeBonus: data.percentualeBonus,
          numeroMinimoSelezioni: data.numeroMinimoSelezioni,
          bonus: data.bonus || 0,
          rimborso: data.rimborso || 0,
          urlEvento: data.urlEvento,
          note: data.note,
          tag: data.tag === 'none' ? undefined : data.tag,
          quotaCombinata: quotaCombinata,
          vincitaPotenziale: vincitaPotenziale,
        });
        // Update account balance
        const newBalance = account.saldoAttuale - data.stake;
        const newBilancioGiocate = account.bilancioGiocate + data.stake;
        await updateAccount(account.id, {
          ...account,
          saldoAttuale: newBalance,
          bilancioGiocate: newBilancioGiocate,
        });

        if (selectedWallet) {
          // Implementation for wallet balance update would go here
        }

        toast.success('Multipla creata');
      }

      onOpenChange(false);
      form.reset();
      setSelections([
        { evento: '', competizione: '', mercato: '', selezione: '', quota: 1.5, dataEvento: new Date() },
        { evento: '', competizione: '', mercato: '', selezione: '', quota: 1.5, dataEvento: new Date() },
      ]);
    } catch (error: any) {
      console.error('Error in MultiplaBetForm:', error);
      toast.error(error.message || 'Errore durante il salvataggio');
    }
  };

  const filteredAccounts = accounts.filter(
    account => account.intestatario === selectedIntestatario && account.stato === 'Abilitato'
  );

  const allTags = [...PREDEFINED_TAGS, ...tags.map(t => t.nome)];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Modifica Multipla' : mode === 'clone' ? 'Clona Multipla' : 'Nuova Multipla'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Selezioni Multiple */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Selezioni ({selections.length})</h3>
                <div className="text-sm space-y-1">
                  <div>Quota Combinata: <span className="font-bold">@{quotaCombinata.toFixed(2)}</span></div>
                  <div>Vincita Potenziale: <span className="font-bold text-green-600">€{vincitaPotenziale.toFixed(2)}</span></div>
                </div>
              </div>

              {selections.map((selection, index) => (
                <Card key={index} className="p-4">
                  <CardContent className="space-y-3 p-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Selezione #{index + 1}</h4>
                      {selections.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSelection(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Evento *</label>
                        <Input
                          value={selection.evento}
                          onChange={(e) => handleSelectionChange(index, 'evento', e.target.value)}
                          placeholder="Es: Manchester United vs Liverpool"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Competizione</label>
                        <Input
                          value={selection.competizione}
                          onChange={(e) => handleSelectionChange(index, 'competizione', e.target.value)}
                          placeholder="Es: Premier League"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Mercato</label>
                        <Select
                          value={selection.mercato || "none"}
                          onValueChange={(value) => handleSelectionChange(index, 'mercato', value === "none" ? "" : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona mercato" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nessuno</SelectItem>
                            {ALL_SPORT_MARKETS.map((market) => (
                              <SelectItem key={market} value={market}>
                                {market}
                              </SelectItem>
                            ))}
                            {CASINO_MARKETS.map((market) => (
                              <SelectItem key={market} value={market}>
                                {market}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Selezione *</label>
                        <Input
                          value={selection.selezione}
                          onChange={(e) => handleSelectionChange(index, 'selezione', e.target.value)}
                          placeholder="Es: Manchester United"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Quota *</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={selection.quota}
                          onChange={(e) => handleSelectionChange(index, 'quota', parseFloat(e.target.value) || 1.5)}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Data Evento</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !selection.dataEvento && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selection.dataEvento ? format(selection.dataEvento, 'PPP HH:mm') : 'Seleziona data'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <div className="space-y-3 p-3">
                              <Calendar
                                mode="single"
                                selected={selection.dataEvento}
                                onSelect={(date) => {
                                  if (date) {
                                    const newDate = new Date(date);
                                    newDate.setHours(selection.dataEvento.getHours());
                                    newDate.setMinutes(selection.dataEvento.getMinutes());
                                    handleSelectionChange(index, 'dataEvento', newDate);
                                  }
                                }}
                                className="pointer-events-auto"
                              />
                              <TimePicker
                                value={selection.dataEvento}
                                onChange={(date) => handleSelectionChange(index, 'dataEvento', date)}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={handleAddSelection}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Selezione
              </Button>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="intestatario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intestatario *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedIntestatario(value);
                        setSelectedConto('');
                        form.setValue('conto', '');
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona intestatario" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableIntestatari.map((int) => (
                          <SelectItem key={int.id} value={int.nome}>
                            {int.nome}
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
                name="conto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conto *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedConto(value);
                      }}
                      value={field.value}
                      disabled={!selectedIntestatario}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona conto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.conto}>
                            {account.conto} (€{account.saldoAttuale.toFixed(2)})
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
                    <FormLabel>Stake Totale (€) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataEvento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Multipla *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, 'PPP HH:mm') : 'Seleziona data'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bonus Type */}
            <FormField
              control={form.control}
              name="tipoBonus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo Bonus</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setTipoBonus(value as Bet['tipoBonus']);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Nessuno">Nessuno</SelectItem>
                      <SelectItem value="Bonus Multipla">Bonus Multipla</SelectItem>
                      <SelectItem value="Rimborso Multipla">Rimborso Multipla</SelectItem>
                      <SelectItem value="Free Bet Multipla">Free Bet Multipla</SelectItem>
                      <SelectItem value="Assicurazione Multipla">Assicurazione Multipla</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional Bonus Fields */}
            {tipoBonus === 'Bonus Multipla' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="percentualeBonus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentuale Bonus (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numeroMinimoSelezioni"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numero Minimo Selezioni</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 2)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {(tipoBonus === 'Bonus Multipla' || tipoBonus === 'Rimborso Multipla') && (
              <div className="grid grid-cols-2 gap-4">
                {tipoBonus === 'Bonus Multipla' && (
                  <FormField
                    control={form.control}
                    name="bonus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Importo Bonus (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {tipoBonus === 'Rimborso Multipla' && (
                  <FormField
                    control={form.control}
                    name="rimborso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Importo Rimborso (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {/* Other fields */}
            <div className="grid grid-cols-2 gap-4">
              {settings.tag && (
                <FormField
                  control={form.control}
                  name="tag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tag *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona tag" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">-- Seleziona Tag --</SelectItem>
                          {allTags.map((tag) => (
                            <SelectItem key={tag} value={tag}>
                              {tag}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="urlEvento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Evento</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Note aggiuntive..." />
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
                {mode === 'edit' ? 'Salva Modifiche' : 'Crea Multipla'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
