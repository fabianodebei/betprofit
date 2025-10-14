import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { CalendarIcon, AlertCircle, TrendingUp } from 'lucide-react';
import { format, addHours, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { useBets } from '@/contexts/BetContext';
import { useAccounts } from '@/contexts/AccountContext';
import { useTags } from '@/contexts/TagContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useWallets } from '@/contexts/WalletContext';
import { useIntestatari } from '@/contexts/IntestatariContext';
import { SPORT_MARKETS } from '@/constants/markets';
import { PREDEFINED_TAGS } from '@/constants/predefinedTags';
import { Bet } from '@/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/utils/currency';
import { toast } from 'sonner';

const createSingleBetSchema = (tagRequired: boolean) => z.object({
  metodo: z.enum(['Punta', 'Banca']),
  intestatario: z.string().min(1, 'Intestatario è obbligatorio'),
  evento: z.string().min(1, 'Evento è obbligatorio'),
  dataEvento: z.date(),
  mercato: z.string().min(1, 'Mercato è obbligatorio'),
  conto: z.string().min(1, 'Conto è obbligatorio'),
  stake: z.number().min(0, 'Lo stake non può essere negativo'),
  quota: z.number().min(1.01, 'La quota deve essere almeno 1.01'),
  tipoBonus: z.enum(['Nessuno', 'Bonus', 'Rimborso', 'Free Bet']),
  bonus: z.number().optional(),
  rimborso: z.number().optional(),
  urlEvento: z.string().optional(),
  competizione: z.string().optional(),
  tag: tagRequired
    ? z.string().min(1, 'Tag è obbligatorio').refine(val => val !== 'none', 'Seleziona un tag valido')
    : z.string().optional(),
}).refine(
  (data) => {
    // Se tipoBonus è Nessuno, stake deve essere > 0
    if (data.tipoBonus === 'Nessuno' && data.stake <= 0) {
      return false;
    }
    // Se tipoBonus è Bonus/Free Bet, almeno uno tra stake o bonus deve essere > 0
    if (['Bonus', 'Free Bet'].includes(data.tipoBonus)) {
      return data.stake > 0 || (data.bonus && data.bonus > 0);
    }
    return true;
  },
  {
    message: 'Devi inserire almeno uno stake o un importo bonus',
    path: ['stake'],
  }
);

type SingleBetFormData = z.infer<ReturnType<typeof createSingleBetSchema>>;

interface SingleBetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBet?: Bet | null;
  mode?: 'create' | 'edit' | 'clone';
}

export function SingleBetForm({ open, onOpenChange, editingBet, mode = 'create' }: SingleBetFormProps) {
  const { bets, addBet, updateBet } = useBets();
  const { accounts, updateAccount } = useAccounts();
  const { tags } = useTags();
  const { settings } = useSettings();
  const { wallets } = useWallets();
  const { intestatari } = useIntestatari();
  const [tipoBonus, setTipoBonus] = useState<Bet['tipoBonus']>('Nessuno');
  const [selectedIntestatario, setSelectedIntestatario] = useState<string>('');
  const [selectedConto, setSelectedConto] = useState<string>('');
  const [bonusDetailsOpen, setBonusDetailsOpen] = useState(false);
  const [optionalDetailsOpen, setOptionalDetailsOpen] = useState(false);
  // Local string states for numeric inputs to allow free typing (supports comma)
  const [stakeInput, setStakeInput] = useState<string>('');
  const [quotaInput, setQuotaInput] = useState<string>('');
  const parseDecimal = (val: string) => {
    if (!val) return NaN;
    return parseFloat(val.replace(',', '.'));
  };

  const singleBetSchema = createSingleBetSchema(settings.tag);

  const form = useForm<SingleBetFormData>({
    resolver: zodResolver(singleBetSchema),
    defaultValues: {
      metodo: 'Punta',
      intestatario: '',
      evento: '',
      dataEvento: new Date(),
      mercato: '',
      conto: '',
      stake: 0,
      quota: 1.01,
      tipoBonus: 'Nessuno',
      bonus: 0,
      rimborso: 0,
      urlEvento: '',
      competizione: '',
      tag: 'none',
    },
  });

  // Get the selected account's wallet info
  const selectedAccount = accounts.find(a => a.conto === selectedConto);
  const selectedWallet = selectedAccount?.walletId 
    ? wallets.find(w => w.id === selectedAccount.walletId) 
    : null;

  // Get available intestatari (abilitati) - stabilized with useMemo
  const availableIntestatari = useMemo(
    () => intestatari.filter(int => int.stato === 'Abilitato'),
    [intestatari]
  );

  // Calculate potential win in real-time
  const stake = form.watch('stake');
  const quota = form.watch('quota');
  const bonus = form.watch('bonus');
  const potentialWin = useMemo(() => {
    if (tipoBonus === 'Free Bet') {
      // Free Bet: vincita = bonus * quota (non ho messo soldi miei)
      return (bonus || 0) * quota;
    } else if (tipoBonus === 'Bonus' && bonus) {
      // Bonus: vincita = (stake + bonus) * quota - stake
      return (stake + bonus) * quota - stake;
    } else {
      // Normale: vincita = stake * quota - stake
      return stake * quota - stake;
    }
  }, [stake, quota, bonus, tipoBonus]);

  // Check if stake exceeds balance
  const stakeExceedsBalance = useMemo(() => {
    // Con Free Bet non verifichiamo il saldo (sono soldi gratis del bookmaker)
    if (tipoBonus === 'Free Bet') return false;
    if (stake === 0) return false; // Stake 0 è valido con bonus
    if (selectedAccount && stake) {
      return stake > selectedAccount.saldoAttuale;
    }
    return false;
  }, [selectedAccount, stake, tipoBonus]);

  // Check if quota is low
  const isLowOdds = useMemo(() => {
    return quota < 1.10;
  }, [quota]);

  // Check if event date is in the past
  const eventDate = form.watch('dataEvento');
  const isDateInPast = useMemo(() => {
    return eventDate && isPast(eventDate);
  }, [eventDate]);

  // Quick actions rimosse

  // Template funzioni rimosse

  useEffect(() => {
    if (!open) return;

    // Convert old bonus type values to new ones
    const convertBonusType = (oldType: string | undefined): 'Nessuno' | 'Bonus' | 'Rimborso' | 'Free Bet' => {
      if (!oldType) return 'Nessuno';
      if (oldType === 'Bonus Multipla') return 'Bonus';
      if (oldType === 'Rimborso Multipla') return 'Rimborso';
      if (oldType === 'Free Bet Multipla') return 'Free Bet';
      if (['Nessuno', 'Bonus', 'Rimborso', 'Free Bet'].includes(oldType)) return oldType as any;
      return 'Nessuno';
    };

    if (editingBet) {
      const account = accounts.find(a => a.conto === editingBet.conto);
      const intestatario = account?.intestatario || '';
      
      form.reset({
        metodo: (editingBet.metodo as 'Punta' | 'Banca') || 'Punta',
        intestatario: intestatario,
        evento: editingBet.evento || '',
        dataEvento: new Date(editingBet.dataEvento),
        mercato: editingBet.mercato || '',
        conto: editingBet.conto,
        stake: editingBet.stake,
        quota: editingBet.quota || 1.01,
        tipoBonus: convertBonusType(editingBet.tipoBonus),
        bonus: editingBet.bonus || 0,
        rimborso: editingBet.rimborso || 0,
        urlEvento: editingBet.urlEvento || '',
        competizione: editingBet.competizione || '',
        tag: editingBet.tag || 'none',
      });
      setSelectedIntestatario(intestatario);
      setSelectedConto(editingBet.conto);
      setTipoBonus(editingBet.tipoBonus || 'Nessuno');
    } else {
      // Smart pre-selection for new bets
      const lastUsedConto = localStorage.getItem('last_used_conto');
      const defaultIntestatario = availableIntestatari.length > 0 ? availableIntestatari[0].nome : '';
      let preselectedConto = '';
      
      // If we have a last used account that still exists, use it
      if (lastUsedConto && accounts.find(a => a.conto === lastUsedConto)) {
        preselectedConto = lastUsedConto;
        const account = accounts.find(a => a.conto === lastUsedConto);
        if (account) {
          setSelectedIntestatario(account.intestatario);
        }
      } else if (defaultIntestatario) {
        // Otherwise, use the first available intestatario's first account
        const firstAccount = accounts.find(a => a.intestatario === defaultIntestatario);
        if (firstAccount) {
          preselectedConto = firstAccount.conto;
        }
        setSelectedIntestatario(defaultIntestatario);
      }
      
      form.reset({
        metodo: 'Punta',
        intestatario: defaultIntestatario,
        evento: '',
        dataEvento: addHours(new Date(), 1), // Default to 1 hour from now
        mercato: '',
        conto: preselectedConto,
        stake: 0,
        quota: 1.01,
        tipoBonus: 'Nessuno',
        bonus: 0,
        rimborso: 0,
        urlEvento: '',
        competizione: '',
        tag: 'none',
      });
      setSelectedConto(preselectedConto);
      setTipoBonus('Nessuno');
    }

    // Sync local numeric inputs after reset
    const s = form.getValues('stake');
    const q = form.getValues('quota');
    setStakeInput(s !== undefined && s !== null ? String(s) : '');
    setQuotaInput(q !== undefined && q !== null ? String(q) : '');
  }, [open, editingBet?.id]);

  const onSubmit = async (data: SingleBetFormData) => {
    // Verificare che ci sia almeno uno stake o un bonus
    const stake = data.stake || 0;
    const bonus = data.tipoBonus === 'Bonus' || data.tipoBonus === 'Free Bet' ? (data.bonus || 0) : 0;
    
    if (stake === 0 && bonus === 0 && data.tipoBonus !== 'Rimborso') {
      toast.error('Inserisci almeno uno stake o un importo bonus');
      return;
    }

    const account = accounts.find((a) => a.conto === data.conto);
    
    // Save last used account to localStorage
    localStorage.setItem('last_used_conto', data.conto);
    
    if (mode === 'edit' && editingBet) {
      // Modalità modifica: aggiorna la scommessa esistente
      await updateBet(editingBet.id, {
        evento: data.evento,
        dataEvento: data.dataEvento,
        mercato: data.mercato,
        metodo: data.metodo,
        quota: data.quota,
        tipoBonus: data.tipoBonus,
        bonus: data.bonus,
        rimborso: data.rimborso,
        urlEvento: data.urlEvento,
        competizione: data.competizione,
        walletId: account?.walletId || undefined,
        tag: data.tag === 'none' ? '' : data.tag,
      });
    } else {
      // Modalità crea/clona: crea una nuova scommessa
      // Aggiorna il saldo solo se stake > 0 e NON è Free Bet o Bonus totale (stake=0)
      if (account && data.stake > 0 && data.tipoBonus !== 'Free Bet') {
        const newBalance = account.saldoAttuale - data.stake;
        await updateAccount(account.id, { 
          saldoAttuale: newBalance,
          bilancioGiocate: account.bilancioGiocate - data.stake 
        });
      }

      await addBet({
        tipo: 'Singola',
        conto: data.conto,
        stake: data.stake,
        quota: data.quota,
        evento: data.evento,
        dataEvento: data.dataEvento,
        metodo: data.metodo,
        tipoBonus: data.tipoBonus,
        bonus: data.bonus,
        rimborso: data.rimborso,
        stato: 'In Corso',
        mercato: data.mercato,
        urlEvento: data.urlEvento,
        competizione: data.competizione,
        walletId: account?.walletId || undefined,
        tag: data.tag === 'none' ? '' : data.tag,
      });
    }

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Modifica Puntata Singola' : mode === 'clone' ? 'Clona Puntata Singola' : 'Nuova Puntata Singola'}
          </DialogTitle>
          <DialogDescription>
            Compila i campi obbligatori e premi Salva.
          </DialogDescription>
        </DialogHeader>

        

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Essential Data Section - Always Open */}
            <div className="space-y-4">
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
                        onClick={() => field.onChange('Punta')}
                        className="flex-1"
                      >
                        Punta
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === 'Banca' ? 'default' : 'outline'}
                        onClick={() => field.onChange('Banca')}
                        className="flex-1"
                      >
                        Banca
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="evento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evento *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Es: Roma vs Lazio" 
                        autoFocus
                        {...field} 
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
                    {isDateInPast && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Attenzione: la data dell'evento è nel passato
                        </AlertDescription>
                      </Alert>
                    )}
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
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
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
                name="intestatario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intestatario *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedIntestatario(value);
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
                        {availableIntestatari.map((intestatario) => (
                          <SelectItem key={intestatario.id} value={intestatario.nome}>
                            {intestatario.nome}
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
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona conto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts
                          .filter(account => account.intestatario === selectedIntestatario)
                          .map((account) => {
                            const wallet = account.walletId 
                              ? wallets.find(w => w.id === account.walletId)
                              : null;
                            return (
                              <SelectItem key={account.id} value={account.conto}>
                                {account.conto}
                                {wallet && <span className="text-muted-foreground text-xs ml-1">({wallet.nome})</span>}
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                    {selectedAccount && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant={stakeExceedsBalance ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          Saldo: {formatCurrency(selectedAccount.saldoAttuale)}
                        </Badge>
                        {selectedWallet && (
                          <span className="text-xs text-muted-foreground">
                            Wallet: {selectedWallet.nome}
                          </span>
                        )}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="stake"
                  render={() => (
                    <FormItem>
                      <FormLabel>
                        Stake {tipoBonus === 'Nessuno' ? '*' : '(opzionale se hai un bonus)'}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder={tipoBonus === 'Nessuno' ? '0,00' : '0,00 (lascia 0 per solo bonus)'}
                            value={stakeInput}
                            onChange={(e) => setStakeInput(e.target.value)}
                            onBlur={() => {
                              const num = parseDecimal(stakeInput);
                              form.setValue('stake', Number.isFinite(num) ? num : 0, { shouldValidate: true });
                            }}
                            className={cn(stakeExceedsBalance && "border-destructive")}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                        </div>
                      </FormControl>
                      {stakeExceedsBalance && stake > 0 && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Saldo insufficiente
                          </AlertDescription>
                        </Alert>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quota"
                  render={() => (
                    <FormItem>
                      <FormLabel>Quota Punta *</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="1,01"
                          value={quotaInput}
                          onChange={(e) => setQuotaInput(e.target.value)}
                          onBlur={() => {
                            const num = parseDecimal(quotaInput);
                            form.setValue('quota', Number.isFinite(num) ? num : 1.01, { shouldValidate: true });
                          }}
                          className={cn(isLowOdds && "border-orange-500")}
                        />
                      </FormControl>
                      {isLowOdds && (
                        <p className="text-xs text-orange-500 mt-1">
                          ⚠️ Quota bassa
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Potential Win Display */}
              {((stake > 0) || (bonus && bonus > 0)) && quota > 1 && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Vincita potenziale</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(potentialWin)}</p>
                    {stake === 0 && bonus && bonus > 0 && (
                      <p className="text-xs text-muted-foreground">Calcolata su bonus</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bonus and Refunds Section - Collapsible */}
            <Collapsible open={bonusDetailsOpen} onOpenChange={setBonusDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" className="w-full flex justify-between">
                  <span>Bonus e Rimborsi</span>
                  <span>{bonusDetailsOpen ? '▲' : '▼'}</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="tipoBonus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Bonus *</FormLabel>
                      <div className="flex gap-2">
                        {(['Nessuno', 'Bonus', 'Rimborso', 'Free Bet'] as const).map((tipo) => (
                          <Button
                            key={tipo}
                            type="button"
                            variant={field.value === tipo ? 'default' : 'outline'}
                            onClick={() => {
                              field.onChange(tipo);
                              setTipoBonus(tipo);
                            }}
                            className="flex-1"
                          >
                            {tipo}
                          </Button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {tipoBonus === 'Bonus' && (
                  <FormField
                    control={form.control}
                    name="bonus"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Bonus</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              value={value || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                onChange(val === '' ? 0 : parseFloat(val));
                              }}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                          </div>
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
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Rimborso</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              value={value || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                onChange(val === '' ? 0 : parseFloat(val));
                              }}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Optional Details Section - Collapsible */}
            <Collapsible open={optionalDetailsOpen} onOpenChange={setOptionalDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" className="w-full flex justify-between">
                  <span>Dettagli Opzionali</span>
                  <span>{optionalDetailsOpen ? '▲' : '▼'}</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="urlEvento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Evento</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="competizione"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Competizione</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Es: Serie A" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tag{settings.tag && ' *'}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={settings.tag ? "Seleziona tag" : "Seleziona tag (opzionale)"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {!settings.tag && <SelectItem value="none">Nessuno</SelectItem>}
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
              </CollapsibleContent>
            </Collapsible>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Chiudi
              </Button>
              <Button type="submit" disabled={stakeExceedsBalance}>Salva</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
