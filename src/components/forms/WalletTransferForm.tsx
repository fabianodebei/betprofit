import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useWallets } from '@/contexts/WalletContext';
import { useAccounts } from '@/contexts/AccountContext';

const transferSchema = z.object({
  fromWallet: z.string().min(1, 'Seleziona wallet sorgente'),
  toAccount: z.string().min(1, 'Seleziona conto destinazione'),
  amount: z.number().positive('L\'importo deve essere positivo'),
});

type TransferFormData = z.infer<typeof transferSchema>;

interface WalletTransferFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletTransferForm({ open, onOpenChange }: WalletTransferFormProps) {
  const { wallets, updateWallet } = useWallets();
  const { accounts, updateAccount } = useAccounts();

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromWallet: '',
      toAccount: '',
      amount: 0,
    },
  });

  const onSubmit = async (data: TransferFormData) => {
    const wallet = wallets.find((w) => w.nome === data.fromWallet);
    const account = accounts.find((a) => a.conto === data.toAccount);

    if (wallet && account) {
      await updateWallet(wallet.id, {
        saldoAttuale: wallet.saldoAttuale - data.amount,
      });

      await updateAccount(account.id, {
        saldoAttuale: account.saldoAttuale + data.amount,
      });
    }

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Trasferisci da Wallet a Conto</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fromWallet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Da Wallet *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona wallet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets
                        .filter((w) => w.stato === 'Abilitato')
                        .map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.nome}>
                            {wallet.nome}
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
              name="toAccount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>A Conto *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona conto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts
                        .filter((a) => a.stato === 'Abilitato')
                        .map((account) => (
                          <SelectItem key={account.id} value={account.conto}>
                            {account.conto}
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Importo *</FormLabel>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Chiudi
              </Button>
              <Button type="submit">Trasferisci</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
