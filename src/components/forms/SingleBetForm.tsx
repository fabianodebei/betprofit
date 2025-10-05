import { useState } from 'react';
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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useBets } from '@/contexts/BetContext';
import { useAccounts } from '@/contexts/AccountContext';
import { toast } from 'sonner';

const singleBetSchema = z.object({
  metodo: z.enum(['Punta', 'Banca']),
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
});

type SingleBetFormData = z.infer<typeof singleBetSchema>;

interface SingleBetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SingleBetForm({ open, onOpenChange }: SingleBetFormProps) {
  const { addBet } = useBets();
  const { accounts, updateAccount } = useAccounts();
  const [tipoBonus, setTipoBonus] = useState<'Nessuno' | 'Bonus' | 'Rimborso' | 'Free Bet'>('Nessuno');

  const form = useForm<SingleBetFormData>({
    resolver: zodResolver(singleBetSchema),
    defaultValues: {
      metodo: 'Punta',
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
    },
  });

  const onSubmit = (data: SingleBetFormData) => {
    const account = accounts.find((a) => a.conto === data.conto);
    
    if (account) {
      const newBalance = account.saldoAttuale - data.stake;
      updateAccount(account.id, { 
        saldoAttuale: newBalance,
        bilancioGiocate: account.bilancioGiocate - data.stake 
      });
    }

    addBet({
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
    });

    toast.success('Puntata singola registrata con successo');
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuova Puntata Singola</DialogTitle>
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
                    <Input placeholder="Es: Roma vs Lazio" {...field} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona mercato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1X2">1X2</SelectItem>
                      <SelectItem value="Under/Over">Under/Over</SelectItem>
                      <SelectItem value="Goal/No Goal">Goal/No Goal</SelectItem>
                      <SelectItem value="Doppia Chance">Doppia Chance</SelectItem>
                      <SelectItem value="Handicap">Handicap</SelectItem>
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
                    <Input placeholder="https://..." {...field} />
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
                    <Input placeholder="Es: Serie A" {...field} />
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
