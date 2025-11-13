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
import { ALL_SPORT_MARKETS } from '@/constants/markets';
import { Bet, BetLeg } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currency';
import { useDebounce } from '@/hooks/useDebounce';

const STORAGE_KEY = 'multipla_form_draft';

interface BetSelection {
  evento: string;
  competizione: string;
  mercato: string;
  selezione: string;
  quota: number;
  dataEvento: Date;
}

interface SavedFormState {
  selections: Array<{
    evento: string;
    competizione: string;
    mercato: string;
    selezione: string;
    quota: number;
    dataEvento: string;
  }>;
  quotaInputs: string[];
  formValues: MultiplaBetFormData;
  selectedIntestatario: string;
  selectedConto: string;
  tipoBonus: string;
}

const saveFormState = (state: SavedFormState) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving form state:', error);
  }
};

const loadFormState = (): SavedFormState | null => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading form state:', error);
  }
  return null;
};

const clearFormState = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing form state:', error);
  }
};

const createMultiplaBetSchema = (tagRequired: boolean) => z.object({
  intestatario: z.string().min(1, 'Intestatario è obbligatorio'),
  conto: z.string().min(1, 'Conto è obbligatorio'),
  stake: z.number(),
  tipoBonus: z.enum(['Nessuno', 'Bonus', 'Rimborso', 'Free Bet']),
  percentualeBonus: z.number().optional(),
  numeroMinimoSelezioni: z.number().optional(),
  bonus: z.number().optional(),
  rimborso: z.number().optional(),
  urlEvento: z.string().optional(),
  note: z.string().optional(),
  tag: tagRequired 
    ? z.string().min(1, 'Tag è obbligatorio').refine(val => val !== 'none', 'Seleziona un tag valido')
    : z.string().optional(),
}).refine((data) => {
  if (data.tipoBonus === 'Nessuno') {
    return data.stake > 0;
  }
  return true;
}, {
  message: 'Lo stake è obbligatorio quando non c\'è un bonus',
  path: ['stake'],
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
  const [selectionErrors, setSelectionErrors] = useState<number[]>([]);
  const [quotaInputs, setQuotaInputs] = useState<string[]>(['1,50', '1,50']);
  
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
  const stake = form.watch('stake');
  const bonus = form.watch('bonus');
  const vincitaPotenziale = useMemo(() => {
    if (tipoBonus === 'Free Bet') {
      // Free Bet: vincita = bonus * quotaCombinata
      return (bonus || 0) * quotaCombinata;
    } else if (tipoBonus === 'Bonus' && bonus) {
      // Bonus: vincita = (stake + bonus) * quotaCombinata - stake
      return (stake + bonus) * quotaCombinata - stake;
    } else {
      // Normale: vincita = stake * quotaCombinata - stake
      return stake * quotaCombinata - stake;
    }
  }, [stake, bonus, quotaCombinata, tipoBonus]);

  useEffect(() => {
    if (editingBet && open) {
      // Clear any saved draft when editing
      clearFormState();
      
      const account = accounts.find(a => a.conto === editingBet.conto);
      const intestatario = account?.intestatario || '';
      
      const bonusTypes = ['Nessuno', 'Bonus', 'Rimborso', 'Free Bet'];
      const validBonus = bonusTypes.includes(editingBet.tipoBonus || 'Nessuno') ? editingBet.tipoBonus : 'Nessuno';
      
      form.reset({
        intestatario: intestatario,
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
          const loadedSelections = existingLegs.map(leg => ({
            evento: leg.evento,
            competizione: leg.competizione || '',
            mercato: leg.mercato || '',
            selezione: leg.selezione,
            quota: leg.quota,
            dataEvento: new Date(leg.dataEvento),
          }));
          setSelections(loadedSelections);
          setQuotaInputs(loadedSelections.map(sel => sel.quota.toFixed(2).replace('.', ',')));
        }
      }
    } else if (!editingBet && open) {
      // Try to load saved state first
      const savedState = loadFormState();
      
      if (savedState) {
        // Restore from saved state
        const restoredSelections = savedState.selections.map(sel => ({
          ...sel,
          dataEvento: new Date(sel.dataEvento),
        }));
        
        setSelections(restoredSelections);
        setQuotaInputs(savedState.quotaInputs);
        setSelectedIntestatario(savedState.selectedIntestatario);
        setSelectedConto(savedState.selectedConto);
        setTipoBonus(savedState.tipoBonus as any);
        
        form.reset(savedState.formValues);
        
        toast.info('Recuperati dati non salvati');
      } else {
        // Default initialization
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
        setQuotaInputs(['1,50', '1,50']);
      }
    }
  }, [editingBet, open, mode]);

  // Auto-save form state with debounce (only when creating, not editing)
  const debouncedSave = useDebounce(() => {
    if (!editingBet && open) {
      const formValues = form.getValues();
      const state: SavedFormState = {
        selections: selections.map(sel => ({
          ...sel,
          dataEvento: sel.dataEvento.toISOString(),
        })),
        quotaInputs,
        formValues,
        selectedIntestatario,
        selectedConto,
        tipoBonus,
      };
      saveFormState(state);
    }
  }, 500);

  // Trigger auto-save when form data changes
  useEffect(() => {
    if (!editingBet && open) {
      debouncedSave();
    }
  }, [selections, quotaInputs, selectedIntestatario, selectedConto, tipoBonus, form.watch()]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only clear if not in the middle of a form submission
      if (!editingBet) {
        clearFormState();
      }
    };
  }, []);

  // Handle dialog close
  const handleDialogClose = (newOpen: boolean) => {
    if (!newOpen && !editingBet) {
      // Clear saved state when closing without editing
      clearFormState();
    }
    onOpenChange(newOpen);
  };

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
    setQuotaInputs([...quotaInputs, '1,50']);
  };

  const handleRemoveSelection = (index: number) => {
    if (selections.length <= 2) {
      toast.error('Minimo 2 selezioni per una multipla');
      return;
    }
    setSelections(selections.filter((_, i) => i !== index));
    setQuotaInputs(quotaInputs.filter((_, i) => i !== index));
  };

  const handleSelectionChange = (index: number, field: keyof BetSelection, value: any) => {
    const newSelections = [...selections];
    newSelections[index] = { ...newSelections[index], [field]: value };
    setSelections(newSelections);
  };

  const onSubmit = async (data: MultiplaBetFormData) => {
    try {
      // Validate selections
      const errors: number[] = [];
      selections.forEach((s, index) => {
        if (!s.evento || !s.selezione || s.quota <= 1) {
          errors.push(index);
        }
      });
      
      if (errors.length > 0) {
        setSelectionErrors(errors);
        toast.error('Compila tutti i campi obbligatori delle selezioni e assicurati che le quote siano superiori a 1');
        return;
      }
      
      setSelectionErrors([]);

      if (quotaCombinata > 50) {
        toast.warning('Attenzione: quota combinata molto alta (@' + quotaCombinata.toFixed(2) + ')');
      }

      const account = accounts.find(a => a.conto === data.conto);
      if (!account) {
        toast.error('Conto non trovato');
        return;
      }
      
      // Controllo fondi disponibili reali (saldo + bilanci)
      if (data.stake > 0 && data.tipoBonus !== 'Free Bet' && data.tipoBonus !== 'Bonus') {
        const disponibile = account.saldoAttuale + account.bilancioGiocate + account.bilancioGiocateRapide;
        if (data.stake > disponibile) {
          toast.error(`Saldo insufficiente! Disponibile: ${formatCurrency(disponibile)}, Richiesto: ${formatCurrency(data.stake)}`);
          return;
        }
      }

      if (mode === 'edit' && editingBet) {
        // Per le multiple usiamo la data della prima partita
        const firstMatchDate = selections.length > 0 ? selections[0].dataEvento : new Date();
        
        await updateBet(editingBet.id, {
          ...editingBet,
          conto: data.conto,
          stake: data.stake,
          dataEvento: firstMatchDate,
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
        // Per le multiple usiamo la data della prima partita
        const firstMatchDate = selections.length > 0 ? selections[0].dataEvento : new Date();
        
        const betId = await addBet({
          tipo: 'Multipla',
          conto: data.conto,
          stake: data.stake,
          evento: selections.map(s => s.selezione).join(', '),
          dataEvento: firstMatchDate,
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

        // Save all selections as bet legs
        for (const selection of selections) {
          await addBetLeg({
            betId: betId,
            evento: selection.evento,
            competizione: selection.competizione || undefined,
            mercato: selection.mercato || undefined,
            selezione: selection.selezione,
            quota: selection.quota,
            stato: 'In Corso',
            dataEvento: selection.dataEvento,
          });
        }
        
        // Nessun aggiornamento saldo: i bilanci vengono ricalcolati automaticamente dalle puntate in corso

        if (selectedWallet) {
          // Implementation for wallet balance update would go here
        }

        toast.success('Multipla creata');
      }

      // Clear saved state after successful submission
      clearFormState();
      
      onOpenChange(false);
      form.reset();
      setSelections([
        { evento: '', competizione: '', mercato: '', selezione: '', quota: 1.5, dataEvento: new Date() },
        { evento: '', competizione: '', mercato: '', selezione: '', quota: 1.5, dataEvento: new Date() },
      ]);
      setQuotaInputs(['1,50', '1,50']);
    } catch (error: any) {
      console.error('Error in MultiplaBetForm:', error);
      toast.error(error.message || 'Errore durante il salvataggio');
    }
  };

  const filteredAccounts = accounts.filter(
    account => account.intestatario === selectedIntestatario && account.stato === 'Abilitato'
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
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
                          onChange={(e) => {
                            let value = e.target.value;
                            // Se l'utente digita uno spazio e non c'è già "vs" nel testo
                            if (value.endsWith(' ') && !value.includes('vs') && value.trim().split(' ').length === 1) {
                              value = value.trim() + ' vs ';
                            }
                            handleSelectionChange(index, 'evento', value);
                          }}
                          placeholder="Es: Manchester United vs Liverpool"
                          className={cn(
                            selectionErrors.includes(index) && !selection.evento && 
                            "border-destructive focus-visible:ring-destructive"
                          )}
                        />
                        {selectionErrors.includes(index) && !selection.evento && (
                          <p className="text-sm text-destructive mt-1">Campo obbligatorio</p>
                        )}
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
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Selezione *</label>
                        <Input
                          value={selection.selezione}
                          onChange={(e) => handleSelectionChange(index, 'selezione', e.target.value)}
                          placeholder="Es: Manchester United"
                          className={cn(
                            selectionErrors.includes(index) && !selection.selezione && 
                            "border-destructive focus-visible:ring-destructive"
                          )}
                        />
                        {selectionErrors.includes(index) && !selection.selezione && (
                          <p className="text-sm text-destructive mt-1">Campo obbligatorio</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium">Quota *</label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={quotaInputs[index] || ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^\d]/g, ''); // Solo numeri
                            const newQuotaInputs = [...quotaInputs];
                            
                            if (value.length === 0) {
                              newQuotaInputs[index] = '';
                              setQuotaInputs(newQuotaInputs);
                            } else if (value.length <= 2) {
                              newQuotaInputs[index] = value;
                              setQuotaInputs(newQuotaInputs);
                            } else {
                              const intPart = value.slice(0, -2);
                              const decPart = value.slice(-2);
                              newQuotaInputs[index] = intPart + ',' + decPart;
                              setQuotaInputs(newQuotaInputs);
                            }
                          }}
                          onBlur={() => {
                            const value = quotaInputs[index];
                            const num = parseFloat(value.replace(',', '.'));
                            handleSelectionChange(index, 'quota', Number.isFinite(num) && num > 0 ? num : 1.5);
                          }}
                          className={cn(
                            selectionErrors.includes(index) && selection.quota <= 1 && 
                            "border-destructive focus-visible:ring-destructive"
                          )}
                        />
                        {selectionErrors.includes(index) && selection.quota <= 1 && (
                          <p className="text-sm text-destructive mt-1">La quota deve essere maggiore di 1</p>
                        )}
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
            <div className="grid grid-cols-3 gap-4">
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
                    <FormLabel>
                      Stake Totale (€) {tipoBonus === 'Nessuno' && '*'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={tipoBonus !== 'Nessuno'}
                      />
                    </FormControl>
                    <FormMessage />
                    {tipoBonus !== 'Nessuno' && (
                      <p className="text-xs text-muted-foreground">
                        Non richiesto con bonus/free bet
                      </p>
                    )}
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
                      <SelectItem value="Bonus">Bonus Multipla</SelectItem>
                      <SelectItem value="Rimborso">Rimborso Multipla</SelectItem>
                      <SelectItem value="Free Bet">Free Bet Multipla</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional Bonus Fields */}
            {tipoBonus === 'Bonus' && (
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

            {(tipoBonus === 'Bonus' || tipoBonus === 'Rimborso') && (
              <div className="grid grid-cols-2 gap-4">
                {tipoBonus === 'Bonus' && (
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

                {tipoBonus === 'Rimborso' && (
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
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                            Predefinito
                          </div>
                          {PREDEFINED_TAGS.map((tag) => (
                            <SelectItem key={tag} value={tag}>
                              {tag}
                            </SelectItem>
                          ))}
                          {tags.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase mt-2">
                                Tag Personali
                              </div>
                              {tags.map((tag) => (
                                <SelectItem key={tag.id} value={tag.nome}>
                                  {tag.nome}
                                </SelectItem>
                              ))}
                            </>
                          )}
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
