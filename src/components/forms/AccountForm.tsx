import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAccounts } from '@/contexts/AccountContext';
import { useWallets } from '@/contexts/WalletContext';
import { Account } from '@/types';

const accountSchema = z.object({
  intestatario: z.string().min(1, 'Intestatario è obbligatorio'),
  conto: z.string().min(1, 'Nome conto è obbligatorio'),
  descrizione: z.string().optional(),
  stato: z.enum(['Abilitato', 'Disabilitato']),
  walletId: z.string().optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAccount?: Account | null;
}

export function AccountForm({ open, onOpenChange, editingAccount }: AccountFormProps) {
  const { addAccount, updateAccount, accounts } = useAccounts();
  const { wallets } = useWallets();

  // Ottieni lista unica di nomi bookmaker
  const bookmakers = Array.from(new Set(accounts.map(acc => acc.conto))).sort();

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      intestatario: '',
      conto: '',
      descrizione: '',
      stato: 'Abilitato',
      walletId: '',
    },
  });

  useEffect(() => {
    if (editingAccount && open) {
      form.reset({
        intestatario: editingAccount.intestatario,
        conto: editingAccount.conto,
        descrizione: editingAccount.descrizione || '',
        stato: editingAccount.stato,
        walletId: editingAccount.walletId || '',
      });
    } else if (!open) {
      form.reset({
        intestatario: '',
        conto: '',
        descrizione: '',
        stato: 'Abilitato',
        walletId: '',
      });
    }
  }, [editingAccount, open, form]);

  const onSubmit = async (data: AccountFormData) => {
    if (editingAccount) {
      await updateAccount(editingAccount.id, {
        intestatario: data.intestatario,
        conto: data.conto,
        descrizione: data.descrizione,
        stato: data.stato,
        walletId: data.walletId || undefined,
      });
    } else {
      await addAccount({
        intestatario: data.intestatario,
        conto: data.conto,
        descrizione: data.descrizione,
        stato: data.stato,
        walletId: data.walletId || undefined,
      });
    }
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingAccount ? 'Modifica Conto' : 'Nuovo Conto'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="intestatario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intestatario *</FormLabel>
                  <FormControl>
                    <Input placeholder="Es: Mario Rossi" {...field} />
                  </FormControl>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona bookmaker" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bookmakers.map((bookmaker) => (
                        <SelectItem key={bookmaker} value={bookmaker}>
                          {bookmaker}
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
              name="walletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet Collegato</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? undefined : value)} 
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona wallet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nessuno</SelectItem>
                      {wallets
                        .filter((w) => w.stato === 'Abilitato')
                        .map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.nome} - {wallet.intestatario}
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
            <FormField
              control={form.control}
              name="stato"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stato *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona stato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Abilitato">Abilitato</SelectItem>
                      <SelectItem value="Disabilitato">Disabilitato</SelectItem>
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
