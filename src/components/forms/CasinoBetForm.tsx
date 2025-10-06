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
import { TimePicker } from '@/components/ui/time-picker';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useBets } from '@/contexts/BetContext';
import { useAccounts } from '@/contexts/AccountContext';
import { CASINO_MARKETS } from '@/constants/markets';
import { toast } from 'sonner';

const casinoBetSchema = z.object({
  nomeGioco: z.string().min(1, 'Nome gioco è obbligatorio'),
  dataEvento: z.date(),
  mercato: z.string().min(1, 'Mercato è obbligatorio'),
  conto: z.string().min(1, 'Conto è obbligatorio'),
  stake: z.number().positive('Lo stake deve essere positivo'),
  quota: z.number().min(1.01, 'La quota deve essere almeno 1.01'),
  tipoBonus: z.enum(['Nessuno', 'Bonus', 'Rimborso']),
  bonus: z.number().optional(),
  rimborso: z.number().optional(),
});

type CasinoBetFormData = z.infer<typeof casinoBetSchema>;

interface CasinoBetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CasinoBetForm({ open, onOpenChange }: CasinoBetFormProps) {
  const { addBet } = useBets();
  const { accounts, updateAccount } = useAccounts();
  const [tipoBonus, setTipoBonus] = useState<'Nessuno' | 'Bonus' | 'Rimborso'>('Nessuno');

  const form = useForm<CasinoBetFormData>({
    resolver: zodResolver(casinoBetSchema),
    defaultValues: {
      nomeGioco: '',
      dataEvento: new Date(),
      mercato: '',
      conto: '',
      stake: 0,
      quota: 1.01,
      tipoBonus: 'Nessuno',
      bonus: 0,
      rimborso: 0,
    },
  });

  const onSubmit = (data: CasinoBetFormData) => {
    const account = accounts.find((a) => a.conto === data.conto);
    
    if (account) {
      const newBalance = account.saldoAttuale - data.stake;
      updateAccount(account.id, { 
        saldoAttuale: newBalance,
        bilancioGiocate: account.bilancioGiocate - data.stake 
      });
    }

    addBet({
      tipo: 'Casino',
      conto: data.conto,
      stake: data.stake,
      quota: data.quota,
      nomeGioco: data.nomeGioco,
      dataEvento: data.dataEvento,
      tipoBonus: data.tipoBonus,
      bonus: data.bonus,
      rimborso: data.rimborso,
      stato: 'In Corso',
    });

    toast.success('Puntata casinò registrata con successo');
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuova Puntata Casinò</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nomeGioco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Gioco *</FormLabel>
                  <FormControl>
                    <Input placeholder="Es: Roulette" {...field} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona mercato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CASINO_MARKETS.map((mercato) => (
                        <SelectItem key={mercato} value={mercato}>
                          {mercato}
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
                    <FormLabel>Quota *</FormLabel>
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
                    {(['Nessuno', 'Bonus', 'Rimborso'] as const).map((tipo) => (
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
