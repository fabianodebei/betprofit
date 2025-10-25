import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useReminders } from '@/contexts/ReminderContext';
import { useAccounts } from '@/contexts/AccountContext';
import { TimePicker } from '@/components/ui/time-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const reminderSchema = z.object({
  metodo: z.string().min(1, 'Metodo richiesto'),
  conto: z.string().optional(),
  descrizione: z.string().min(1, 'Descrizione richiesta'),
  dataScadenza: z.date({
    message: 'Data di scadenza richiesta',
  }),
  notificaPeriodo: z.string().min(1, 'Periodo di notifica richiesto'),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

interface ReminderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReminderForm({ open, onOpenChange }: ReminderFormProps) {
  const { addReminder } = useReminders();
  const { accounts } = useAccounts();

  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      metodo: '',
      conto: '',
      descrizione: '',
      dataScadenza: new Date(),
      notificaPeriodo: '',
    },
  });

  const activeAccounts = accounts.filter(acc => acc.stato === 'Abilitato');

  const onSubmit = async (data: ReminderFormData) => {
    await addReminder({
      metodo: data.metodo,
      conto: data.conto || '',
      descrizione: data.descrizione,
      dataScadenza: data.dataScadenza,
      notificaPeriodo: data.notificaPeriodo,
      stato: 'Nuovo',
    });

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Promemoria Attività</DialogTitle>
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
                        <SelectValue placeholder="Seleziona Metodo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Bonus Benvenuto">Bonus Benvenuto</SelectItem>
                      <SelectItem value="Bonus Personale">Bonus Personale</SelectItem>
                      <SelectItem value="Bonus Ricorrente">Bonus Ricorrente</SelectItem>
                      <SelectItem value="Promemoria Generico">Promemoria Generico</SelectItem>
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
                  <FormLabel>Conto</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona Conto (Opzionale)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeAccounts.map(account => (
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
              name="descrizione"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Inserisci Descrizione" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataScadenza"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data di scadenza *</FormLabel>
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
                          {field.value ? (
                            format(field.value, 'PPP HH:mm')
                          ) : (
                            <span>Inserisci la Data e Ora</span>
                          )}
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
                      <div className="border-t p-3">
                        <TimePicker value={field.value} onChange={field.onChange} />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notificaPeriodo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quando vuoi ricevere la notifica? *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Scegli Periodo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="24h">24 Ore prima</SelectItem>
                      <SelectItem value="12h">12 Ore prima</SelectItem>
                      <SelectItem value="0h">Alla scadenza</SelectItem>
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
