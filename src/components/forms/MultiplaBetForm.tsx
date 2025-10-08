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
import { PREDEFINED_TAGS } from '@/constants/predefinedTags';
import { Bet } from '@/types';

const createMultiplaBetSchema = (tagRequired: boolean) => z.object({
  intestatario: z.string().min(1, 'Intestatario è obbligatorio'),
  evento: z.string().min(1, 'Evento è obbligatorio'),
  dataEvento: z.date(),
  conto: z.string().min(1, 'Conto è obbligatorio'),
  stake: z.number().positive('Lo stake deve essere positivo'),
  quota: z.number().min(1.01, 'La quota deve essere almeno 1.01'),
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
  const { accounts, updateAccount } = useAccounts();
  const { tags } = useTags();
  const { settings } = useSettings();
  const { wallets } = useWallets();
  const { intestatari } = useIntestatari();
  const [selectedIntestatario, setSelectedIntestatario] = useState<string>('');
  const [selectedConto, setSelectedConto] = useState<string>('');

  const multiplaBetSchema = createMultiplaBetSchema(settings.tag);

  const form = useForm<MultiplaBetFormData>({
    resolver: zodResolver(multiplaBetSchema),
    defaultValues: {
      intestatario: '',
      evento: '',
      dataEvento: new Date(),
      conto: '',
      stake: 0,
      quota: 1.01,
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

  useEffect(() => {
    if (editingBet && open) {
      const account = accounts.find(a => a.conto === editingBet.conto);
      const intestatario = account?.intestatario || '';
      
      form.reset({
        intestatario: intestatario,
        evento: editingBet.evento || '',
        dataEvento: new Date(editingBet.dataEvento),
        conto: editingBet.conto,
        stake: editingBet.stake,
        quota: editingBet.quota || 1.01,
        urlEvento: editingBet.urlEvento || '',
        note: editingBet.note || '',
        tag: editingBet.tag || 'none',
      });
      setSelectedIntestatario(intestatario);
      setSelectedConto(editingBet.conto);
    } else if (!editingBet && open) {
      form.reset({
        intestatario: '',
        evento: '',
        dataEvento: new Date(),
        conto: '',
        stake: 0,
        quota: 1.01,
        urlEvento: '',
        note: '',
        tag: 'none',
      });
      setSelectedIntestatario('');
      setSelectedConto('');
    }
  }, [editingBet, open, form, accounts]);

  const onSubmit = async (data: MultiplaBetFormData) => {
    const account = accounts.find((a) => a.conto === data.conto);
    
    if (mode === 'edit' && editingBet) {
      await updateBet(editingBet.id, {
        evento: data.evento,
        dataEvento: data.dataEvento,
        quota: data.quota,
        urlEvento: data.urlEvento,
        note: data.note,
        walletId: account?.walletId || undefined,
        tag: data.tag === 'none' ? '' : data.tag,
      });
    } else {
      // For 'create' and 'clone' modes, create a new bet
      if (account) {
        const newBalance = account.saldoAttuale - data.stake;
        await updateAccount(account.id, { 
          saldoAttuale: newBalance,
          bilancioGiocate: account.bilancioGiocate - data.stake 
        });
      }

      await addBet({
        tipo: 'Multipla',
        conto: data.conto,
        stake: data.stake,
        quota: data.quota,
        evento: data.evento,
        dataEvento: data.dataEvento,
        stato: 'In Corso',
        urlEvento: data.urlEvento,
        note: data.note,
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
            {mode === 'edit' ? 'Modifica Multipla' : mode === 'clone' ? 'Clona Multipla' : 'Nuova Multipla'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="evento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione Multipla *</FormLabel>
                  <FormControl>
                    <Input placeholder="Es: Multipla 3x - Premier League" {...field} />
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
                  <FormLabel>Data Multipla *</FormLabel>
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
                    <FormLabel>Quota Totale *</FormLabel>
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
              name="tag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag {settings.tag && '*'}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona tag" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nessuno</SelectItem>
                      {PREDEFINED_TAGS.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                      {tags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.nome}>
                          {tag.nome}
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
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Input placeholder="Note aggiuntive..." {...field} />
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
