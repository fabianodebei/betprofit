import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useBets } from '@/contexts/BetContext';
import { useAccounts } from '@/contexts/AccountContext';
import { QUICK_BET_METHODS } from '@/constants/markets';
import { toast } from 'sonner';

const quickBetSchema = z.object({
  conto: z.string().min(1, 'Conto è obbligatorio'),
  metodo: z.string().min(1, 'Metodo è obbligatorio'),
  saldoReale: z.number().positive('Il saldo deve essere positivo'),
  movimento: z.number().positive('Il movimento deve essere positivo'),
  registrato: z.date(),
  note: z.string().optional(),
});

type QuickBetFormData = z.infer<typeof quickBetSchema>;

interface QuickBetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickBetForm({ open, onOpenChange }: QuickBetFormProps) {
  const { addBet } = useBets();
  const { accounts, updateAccount } = useAccounts();

  const form = useForm<QuickBetFormData>({
    resolver: zodResolver(quickBetSchema),
    defaultValues: {
      conto: '',
      metodo: '',
      saldoReale: 0,
      movimento: 0,
      registrato: new Date(),
      note: '',
    },
  });

  const onSubmit = async (data: QuickBetFormData) => {
    const account = accounts.find((a) => a.conto === data.conto);
    
    if (account) {
      await updateAccount(account.id, { 
        saldoAttuale: data.saldoReale,
        bilancioGiocateRapide: account.bilancioGiocateRapide + data.movimento 
      });
    }

    await addBet({
      tipo: 'Rapida',
      conto: data.conto,
      stake: data.movimento,
      metodo: data.metodo,
      stato: 'In Corso',
      dataEvento: data.registrato,
      note: data.note,
    });

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuova Giocata Rapida</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="conto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conto *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona conto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.conto}>
                          {account.conto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Questo conto non è modificabile dopo l'inserimento</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="metodo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metodo *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona metodo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {QUICK_BET_METHODS.map((metodo) => (
                        <SelectItem key={metodo} value={metodo}>
                          {metodo}
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
              name="saldoReale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Reale Conto *</FormLabel>
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
                  <FormDescription>Il saldo (Calcolo il Movimento) Inserendo il saldo reale del bookmaker</FormDescription>
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
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
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
