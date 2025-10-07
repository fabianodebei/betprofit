import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useWallets } from '@/contexts/WalletContext';
import { formatCurrency } from '@/utils/currency';

const transferSchema = z.object({
  fromWallet: z.string().min(1, 'Seleziona wallet sorgente'),
  toWallet: z.string().min(1, 'Seleziona wallet destinazione'),
  amount: z.number().positive('L\'importo deve essere positivo'),
  registrato: z.date(),
  descrizione: z.string().optional(),
});

type TransferFormData = z.infer<typeof transferSchema>;

interface WalletTransferFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletTransferForm({ open, onOpenChange }: WalletTransferFormProps) {
  const { wallets, updateWallet } = useWallets();

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromWallet: '',
      toWallet: '',
      amount: 0,
      registrato: new Date(),
      descrizione: '',
    },
  });

  const onSubmit = async (data: TransferFormData) => {
    const fromWallet = wallets.find((w) => w.id === data.fromWallet);
    const toWallet = wallets.find((w) => w.id === data.toWallet);

    if (fromWallet && toWallet) {
      await updateWallet(fromWallet.id, {
        saldoAttuale: fromWallet.saldoAttuale - data.amount,
      });

      await updateWallet(toWallet.id, {
        saldoAttuale: toWallet.saldoAttuale + data.amount,
      });
    }

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuovo Trasferisci</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fromWallet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Da Intestatario *</FormLabel>
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
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.nome} ({formatCurrency(wallet.saldoAttuale)} {wallet.intestatario})
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
              name="toWallet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>A Intestatario *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona wallet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets
                        .filter((w) => w.stato === 'Abilitato' && w.id !== form.watch('fromWallet'))
                        .map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.nome} ({formatCurrency(wallet.saldoAttuale)} {wallet.intestatario})
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
                    <Textarea placeholder="Facoltativo" {...field} />
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
