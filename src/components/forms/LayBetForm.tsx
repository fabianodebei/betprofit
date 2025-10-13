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
import { useLayBets } from '@/contexts/LayBetContext';
import { useAccounts } from '@/contexts/AccountContext';
import { SPORT_MARKETS } from '@/constants/markets';
import { LayBet } from '@/types';

const layBetSchema = z.object({
  metodo: z.enum(['Punta', 'Banca']),
  evento: z.string().min(1, 'Evento è obbligatorio'),
  dataEvento: z.date(),
  mercato: z.string().min(1, 'Mercato è obbligatorio'),
  conto: z.string().min(1, 'Conto è obbligatorio'),
  stake: z.number().positive('Lo stake deve essere positivo'),
  quotaBanca: z.number().min(1.01, 'La quota banca deve essere almeno 1.01'),
  quotaPunta: z.number().min(1.01, 'La quota punta deve essere almeno 1.01'),
  tassePercentuale: z.number().min(0).max(100),
  urlEvento: z.string().optional(),
});

type LayBetFormData = z.infer<typeof layBetSchema>;

interface LayBetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentBetId: string;
  editingLayBet?: LayBet | null;
  mode?: 'create' | 'edit';
  parentBet?: any; // Bet principale per pre-compilare i dati
}

export function LayBetForm({ open, onOpenChange, parentBetId, editingLayBet, mode = 'create', parentBet }: LayBetFormProps) {
  const { addLayBet, updateLayBet } = useLayBets();
  const { accounts } = useAccounts();
  const [selectedMetodo, setSelectedMetodo] = useState<'Punta' | 'Banca'>('Punta');

  const form = useForm<LayBetFormData>({
    resolver: zodResolver(layBetSchema),
    defaultValues: {
      metodo: 'Punta',
      evento: '',
      dataEvento: new Date(),
      mercato: '',
      conto: '',
      stake: 0,
      quotaBanca: 1.01,
      quotaPunta: 1.01,
      tassePercentuale: 0,
      urlEvento: '',
    },
  });

  useEffect(() => {
    if (editingLayBet && open) {
      form.reset({
        metodo: editingLayBet.metodo,
        evento: editingLayBet.evento,
        dataEvento: new Date(editingLayBet.dataEvento),
        mercato: editingLayBet.mercato,
        conto: editingLayBet.conto,
        stake: editingLayBet.stake,
        quotaBanca: editingLayBet.quotaBanca,
        quotaPunta: editingLayBet.quotaPunta,
        tassePercentuale: editingLayBet.tassePercentuale,
        urlEvento: editingLayBet.urlEvento || '',
      });
      setSelectedMetodo(editingLayBet.metodo);
    } else if (!editingLayBet && open && parentBet) {
      // Pre-compila con i dati della bet principale
      form.reset({
        metodo: 'Banca',
        evento: parentBet.evento || '',
        dataEvento: new Date(parentBet.dataEvento),
        mercato: parentBet.mercato || '',
        conto: '',
        stake: 0,
        quotaBanca: 1.01,
        quotaPunta: parentBet.quota || 1.01,
        tassePercentuale: 0,
        urlEvento: parentBet.urlEvento || '',
      });
      setSelectedMetodo('Banca');
    } else if (!editingLayBet && open) {
      form.reset({
        metodo: 'Punta',
        evento: '',
        dataEvento: new Date(),
        mercato: '',
        conto: '',
        stake: 0,
        quotaBanca: 1.01,
        quotaPunta: 1.01,
        tassePercentuale: 0,
        urlEvento: '',
      });
      setSelectedMetodo('Punta');
    }
  }, [editingLayBet, open, form, parentBet]);

  const onSubmit = async (data: LayBetFormData) => {
    if (mode === 'edit' && editingLayBet) {
      await updateLayBet(editingLayBet.id, {
        metodo: data.metodo,
        evento: data.evento,
        dataEvento: data.dataEvento,
        mercato: data.mercato,
        conto: data.conto,
        stake: data.stake,
        quotaBanca: data.quotaBanca,
        quotaPunta: data.quotaPunta,
        tassePercentuale: data.tassePercentuale,
        urlEvento: data.urlEvento,
      });
    } else {
      await addLayBet({
        parentBetId,
        metodo: data.metodo,
        evento: data.evento,
        dataEvento: data.dataEvento,
        mercato: data.mercato,
        conto: data.conto,
        stake: data.stake,
        quotaBanca: data.quotaBanca,
        quotaPunta: data.quotaPunta,
        tassePercentuale: data.tassePercentuale,
        urlEvento: data.urlEvento,
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
            {mode === 'edit' ? 'Modifica Bancata' : 'Nuova Bancata'}
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
                      onClick={() => {
                        field.onChange('Punta');
                        setSelectedMetodo('Punta');
                      }}
                      className="flex-1"
                    >
                      Punta
                    </Button>
                    <Button
                      type="button"
                      variant={field.value === 'Banca' ? 'default' : 'outline'}
                      onClick={() => {
                        field.onChange('Banca');
                        setSelectedMetodo('Banca');
                      }}
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
                      {accounts
                        .filter(account => account.stato === 'Abilitato')
                        .map((account) => (
                          <SelectItem key={account.id} value={account.conto}>
                            {account.conto} - {account.intestatario}
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
            {selectedMetodo === 'Banca' ? (
              <FormField
                control={form.control}
                name="quotaBanca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quota Exchange *</FormLabel>
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
            ) : (
              <FormField
                control={form.control}
                name="quotaPunta"
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
            )}
            <FormField
              control={form.control}
              name="tassePercentuale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tasse % *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                  </FormControl>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annulla
              </Button>
              <Button type="submit">
                {mode === 'edit' ? 'Salva Modifiche' : 'Aggiungi Bancata'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
