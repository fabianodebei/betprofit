import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useWallets } from '@/contexts/WalletContext';

const transactionSchema = z.object({
  wallet: z.string().min(1, 'Seleziona wallet'),
  tipo: z.enum(['Ricarica', 'Spesa']),
  importo: z.number().positive('L\'importo deve essere positivo'),
  descrizione: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface WalletTransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletTransactionForm({ open, onOpenChange }: WalletTransactionFormProps) {
  const { wallets, updateWallet } = useWallets();

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      wallet: '',
      tipo: 'Ricarica',
      importo: 0,
      descrizione: '',
    },
  });

  const onSubmit = async (data: TransactionFormData) => {
    const wallet = wallets.find((w) => w.nome === data.wallet);

    if (wallet) {
      const newBalance =
        data.tipo === 'Ricarica'
          ? wallet.saldoAttuale + data.importo
          : wallet.saldoAttuale - data.importo;

      await updateWallet(wallet.id, {
        saldoAttuale: newBalance,
      });
    }

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ricarica/Spesa Wallet</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="wallet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet *</FormLabel>
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
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <div className="flex gap-2">
                    {(['Ricarica', 'Spesa'] as const).map((tipo) => (
                      <Button
                        key={tipo}
                        type="button"
                        variant={field.value === tipo ? 'default' : 'outline'}
                        onClick={() => field.onChange(tipo)}
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
            <FormField
              control={form.control}
              name="importo"
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
