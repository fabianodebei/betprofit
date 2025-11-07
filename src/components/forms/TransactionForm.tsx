import { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTransactions } from '@/contexts/TransactionContext';
import { useAccounts } from '@/contexts/AccountContext';
import { useWallets } from '@/contexts/WalletContext';
import { toast } from 'sonner';

const transactionSchema = z.object({
  metodo: z.enum(['Deposito', 'Spesa', 'Prelievo', 'Riconciliazione']),
  conto: z.string().min(1, 'Conto è obbligatorio'),
  wallet: z.string().optional(),
  movimento: z.number(),
  registrato: z.date(),
  descrizione: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.metodo === 'Riconciliazione') {
    if (!val.movimento || val.movimento === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['movimento'],
        message: 'Per la riconciliazione inserisci un importo diverso da 0 (può essere negativo)'
      });
    }
  } else {
    if (!val.movimento || val.movimento <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['movimento'],
        message: 'Il movimento deve essere maggiore di 0'
      });
    }
  }
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedAccount?: { id: string; conto: string; intestatario: string } | null;
}

export function TransactionForm({ open, onOpenChange, preselectedAccount }: TransactionFormProps) {
  const { addTransaction } = useTransactions();
  const { accounts, updateAccount } = useAccounts();
  const { wallets, updateWallet } = useWallets();
  const [openContoCombobox, setOpenContoCombobox] = useState(false);
  const [selectedIntestatario, setSelectedIntestatario] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      metodo: 'Deposito',
      conto: '',
      wallet: '',
      movimento: undefined as any,
      registrato: new Date(),
      descrizione: '',
    },
  });

  // Preseleziona il conto quando viene passato
  useEffect(() => {
    if (open && preselectedAccount) {
      form.setValue('conto', preselectedAccount.conto);
      setSelectedIntestatario(preselectedAccount.intestatario);
      setSelectedAccountId(preselectedAccount.id);
    }
  }, [open, preselectedAccount, form]);

  // Get filtered wallets based on selected intestatario
  const filteredWallets = selectedIntestatario 
    ? wallets.filter(w => w.intestatario === selectedIntestatario && w.stato === 'Abilitato')
    : [];

  const contoValue = form.watch('conto');

  const selectedAccount = useMemo(() => {
    if (selectedAccountId) return accounts.find(a => a.id === selectedAccountId) || null;
    if (!contoValue) return null;
    const both = accounts.find(a => a.conto === contoValue && a.intestatario === selectedIntestatario);
    if (both) return both;
    return accounts.find(a => a.conto === contoValue) || null;
  }, [selectedAccountId, accounts, selectedIntestatario, contoValue]);

  const onSubmit = async (data: TransactionFormData) => {
    const metodo = data.metodo;
    const account = accounts.find((a) => a.conto === data.conto);
    // Trova il wallet usando nome E intestatario per evitare wallet sbagliati
    const wallet = data.wallet && selectedIntestatario
      ? wallets.find((w) => w.nome === data.wallet && w.intestatario === selectedIntestatario)
      : undefined;

    // Verifica saldo wallet per movimenti in uscita (Deposito)
    if (wallet && data.wallet && metodo === 'Deposito') {
      if (wallet.saldoAttuale < data.movimento) {
        toast.error(`Saldo insufficiente nel wallet ${wallet.nome}. Disponibile: €${wallet.saldoAttuale.toFixed(2)}`);
        return;
      }
    }

    // Verifica saldo conto per movimenti in uscita (Prelievo)
    if (account && metodo === 'Prelievo') {
      if (account.saldoAttuale < data.movimento) {
        toast.error(`Saldo insufficiente nel conto ${account.conto}. Disponibile: €${account.saldoAttuale.toFixed(2)}`);
        return;
      }
    }

    // Update account balance
    if (account) {
      let newBalance = account.saldoAttuale;
      if (metodo === 'Deposito' || metodo === 'Riconciliazione') {
        newBalance = account.saldoAttuale + data.movimento;
      } else {
        newBalance = account.saldoAttuale - data.movimento;
      }
      await updateAccount(account.id, { saldoAttuale: newBalance });
    }

    // Update wallet balance (only if not Riconciliazione)
    if (wallet && data.wallet && metodo !== 'Riconciliazione') {
      const newWalletBalance = metodo === 'Prelievo'
        ? wallet.saldoAttuale + data.movimento
        : wallet.saldoAttuale - data.movimento;
      await updateWallet(wallet.id, { saldoAttuale: newWalletBalance });
    }

    const amountAbs = Math.abs(data.movimento);
    const addebito =
      metodo === 'Prelievo' || metodo === 'Spesa'
        ? amountAbs
        : metodo === 'Riconciliazione' && data.movimento < 0
          ? amountAbs
          : undefined;
    const accredito =
      metodo === 'Deposito'
        ? amountAbs
        : metodo === 'Riconciliazione' && data.movimento > 0
          ? amountAbs
          : undefined;

    await addTransaction({
      metodo: data.metodo,
      conto: data.conto,
      wallet: metodo === 'Riconciliazione' ? undefined : data.wallet,
      addebito,
      accredito,
      descrizione: data.descrizione,
      registrato: data.registrato,
    });

    form.reset();
    setSelectedIntestatario('');
    setSelectedAccountId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuovo Movimento</DialogTitle>
          <DialogDescription>Compila i dettagli del movimento</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="metodo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metodo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona metodo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" className="z-[70] bg-popover">
                      <SelectItem value="Deposito">Deposito</SelectItem>
                      <SelectItem value="Prelievo">Prelievo</SelectItem>
                      <SelectItem value="Riconciliazione">Riconciliazione</SelectItem>
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
                <FormItem className="flex flex-col">
                  <FormLabel>Conto *</FormLabel>
                  <Popover modal={false} open={openContoCombobox} onOpenChange={setOpenContoCombobox}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {selectedAccount ? `${selectedAccount.conto} (${selectedAccount.intestatario})` : "Seleziona Conto"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[100] bg-popover pointer-events-auto" align="start" sideOffset={5}>
                      <Command className="bg-popover pointer-events-auto">
                        <CommandInput placeholder="Cerca conto..." className="h-9" />
                        <CommandEmpty>Nessun conto trovato.</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-auto pointer-events-auto">
                          {accounts
                            .filter(a => a.stato === 'Abilitato')
                            .sort((a, b) => a.conto.localeCompare(b.conto, 'it', { sensitivity: 'base' }))
                            .map((account) => (
                              <CommandItem
                                value={`${account.conto} ${account.intestatario}`}
                                key={account.id}
                                className="cursor-pointer"
                                onSelect={() => {
                                  field.onChange(account.conto);
                                  setSelectedIntestatario(account.intestatario);
                                  setSelectedAccountId(account.id);
                                  form.setValue('wallet', '');
                                  setOpenContoCombobox(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    account.id === selectedAccountId ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {account.conto} ({account.intestatario})
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedIntestatario && filteredWallets.length > 0 && form.watch('metodo') !== 'Riconciliazione' && (
              <FormField
                control={form.control}
                name="wallet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wallet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper" className="z-[70] bg-popover">
                        {filteredWallets.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.nome}>
                            {wallet.nome} - {wallet.intestatario} (€{wallet.saldoAttuale.toFixed(2)})
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
              name="movimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Movimento *</FormLabel>
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
              name="registrato"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Registrato *</FormLabel>
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
              name="descrizione"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Note aggiuntive..." {...field} />
                  </FormControl>
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
