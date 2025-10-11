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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
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

const createSingleBetSchema = (tagRequired: boolean) => z.object({
  metodo: z.enum(['Punta', 'Banca']),
  intestatario: z.string().min(1, 'Intestatario è obbligatorio'),
  evento: z.string().min(1, 'Evento è obbligatorio'),
  dataEvento: z.date(),
  mercato: z.string().min(1, 'Mercato è obbligatorio'),
  conto: z.string().min(1, 'Conto è obbligatorio'),
  stake: z.number().positive('Lo stake deve essere positivo'),
  quota: z.number().min(1.01, 'La quota deve essere almeno 1.01'),
  tipoBonus: z.enum(['Nessuno', 'Bonus', 'Rimborso', 'Free Bet']),
  bonus: z.number().optional(),
  rimborso: z.number().optional(),
  urlEvento: z.string().optional(),
  competizione: z.string().optional(),
  tag: tagRequired
    ? z.string().min(1, 'Tag è obbligatorio').refine(val => val !== 'none', 'Seleziona un tag valido')
    : z.string().optional(),
});

type SingleBetFormData = z.infer<ReturnType<typeof createSingleBetSchema>>;

interface SingleBetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBet?: Bet | null;
  mode?: 'create' | 'edit' | 'clone';
}

export function SingleBetForm({ open, onOpenChange, editingBet, mode = 'create' }: SingleBetFormProps) {
  const { addBet, updateBet } = useBets();
  const { accounts, updateAccount } = useAccounts();
  const { tags } = useTags();
  const { settings } = useSettings();
  const { wallets } = useWallets();
  const { intestatari } = useIntestatari();
  const [tipoBonus, setTipoBonus] = useState<Bet['tipoBonus']>('Nessuno');
  const [selectedIntestatario, setSelectedIntestatario] = useState<string>('');
  const [selectedConto, setSelectedConto] = useState<string>('');

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

  // Get available intestatari (abilitati)
  const availableIntestatari = intestatari.filter(int => int.stato === 'Abilitato');

  useEffect(() => {
    if (editingBet && open) {
      const account = accounts.find(a => a.conto === editingBet.conto);
      const intestatario = account?.intestatario || '';
      
      // Convert old bonus type values to new ones
      const convertBonusType = (oldType: string | undefined): 'Nessuno' | 'Bonus' | 'Rimborso' | 'Free Bet' => {
        if (!oldType) return 'Nessuno';
        if (oldType === 'Bonus Multipla') return 'Bonus';
        if (oldType === 'Rimborso Multipla') return 'Rimborso';
        if (oldType === 'Free Bet Multipla') return 'Free Bet';
        if (['Nessuno', 'Bonus', 'Rimborso', 'Free Bet'].includes(oldType)) return oldType as any;
        return 'Nessuno';
      };
      
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
    } else if (!editingBet && open) {
      form.reset({
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
      });
      setSelectedIntestatario('');
      setSelectedConto('');
      setTipoBonus('Nessuno');
    }
  }, [editingBet, open, form, accounts]);

  const onSubmit = async (data: SingleBetFormData) => {
    const account = accounts.find((a) => a.conto === data.conto);
    
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
      if (account) {
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
                    defaultValue={field.value}
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
                    defaultValue={field.value}
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
                    defaultValue={field.value}
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
                  {selectedWallet && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Wallet: {selectedWallet.nome}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
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
              <FormField
                control={form.control}
                name="quota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quota Punta *</FormLabel>
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
            </div>
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bonus</FormLabel>
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
            )}
            {tipoBonus === 'Rimborso' && (
              <FormField
                control={form.control}
                name="rimborso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rimborso</FormLabel>
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
            )}
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Chiudi
              </Button>
              <Button type="submit">Salva</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
