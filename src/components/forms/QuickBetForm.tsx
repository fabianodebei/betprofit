import { useState, useEffect } from 'react';
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
import { useTags } from '@/contexts/TagContext';
import { useSettings } from '@/contexts/SettingsContext';
import { QUICK_BET_METHODS } from '@/constants/markets';
import { toast } from 'sonner';

const createQuickBetSchema = (tagRequired: boolean) => z.object({
  intestatario: z.string().trim().min(1, 'Intestatario è obbligatorio').max(100),
  conto: z.string().trim().min(1, 'Conto è obbligatorio').max(100),
  metodo: z.string().trim().min(1, 'Metodo è obbligatorio').max(100),
  movimento: z.number(),
  registrato: z.date(),
  note: z.string().trim().max(500).optional(),
  tag: tagRequired 
    ? z.string().min(1, 'Tag è obbligatorio').refine(val => val !== 'none', 'Seleziona un tag valido')
    : z.string().optional()
});

type QuickBetFormData = z.infer<ReturnType<typeof createQuickBetSchema>>;
interface QuickBetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBet?: any;
}
export function QuickBetForm({
  open,
  onOpenChange,
  editingBet
}: QuickBetFormProps) {
  const {
    addBet,
    updateBet
  } = useBets();
  const {
    accounts,
    updateAccount
  } = useAccounts();
  const { tags } = useTags();
  const { settings } = useSettings();
  const [selectedIntestatario, setSelectedIntestatario] = useState<string>('');
  
  const quickBetSchema = createQuickBetSchema(settings.tag);

  const form = useForm<QuickBetFormData>({
    resolver: zodResolver(quickBetSchema),
    defaultValues: {
      intestatario: '',
      conto: '',
      metodo: '',
      movimento: 0,
      registrato: new Date(),
      note: '',
      tag: 'none'
    }
  });

  // Reset form with editing bet data when it changes
  useEffect(() => {
    if (editingBet) {
      const account = accounts.find(a => a.conto === editingBet.conto);
      const intestatario = account?.intestatario || '';
      
      form.reset({
        intestatario: intestatario,
        conto: editingBet.conto || '',
        metodo: editingBet.metodo || '',
        movimento: editingBet.stake || 0,
        registrato: editingBet.dataEvento || new Date(),
        note: editingBet.note || '',
        tag: editingBet.tag || 'none'
      });
      setSelectedIntestatario(intestatario);
    } else {
      form.reset({
        intestatario: '',
        conto: '',
        metodo: '',
        movimento: 0,
        registrato: new Date(),
        note: '',
        tag: 'none'
      });
      setSelectedIntestatario('');
    }
  }, [editingBet, form, accounts]);
  const onSubmit = async (data: QuickBetFormData) => {
    const account = accounts.find(a => a.conto === data.conto);
    if (editingBet) {
      // Update existing bet
      await updateBet(editingBet.id, {
        conto: data.conto,
        stake: data.movimento,
        metodo: data.metodo,
        dataEvento: data.registrato,
        note: data.note,
        tag: data.tag === 'none' ? '' : data.tag
      });
      if (account) {
        const oldStake = editingBet.stake || 0;
        const stakeDifference = data.movimento - oldStake;
        await updateAccount(account.id, {
          bilancioGiocateRapide: account.bilancioGiocateRapide + stakeDifference
        });
      }
    } else {
      // Add new bet
      if (account) {
        await updateAccount(account.id, {
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
        tag: data.tag === 'none' ? '' : data.tag
      });
    }
    form.reset();
    onOpenChange(false);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingBet ? 'Modifica Giocata Rapida' : 'Nuova Giocata Rapida'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="intestatario" render={({
            field
          }) => <FormItem>
                  <FormLabel>Intestatario *</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedIntestatario(value);
                      form.setValue('conto', '');
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona intestatario" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[...new Set(accounts.map(a => a.intestatario))].map(intestatario => <SelectItem key={intestatario} value={intestatario}>
                          {intestatario}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>} />
            <FormField control={form.control} name="conto" render={({
            field
          }) => <FormItem>
                  <FormLabel>Conto *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona conto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts
                        .filter(account => account.intestatario === selectedIntestatario)
                        .map(account => <SelectItem key={account.id} value={account.conto}>
                          {account.conto}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormDescription>Questo conto non è modificabile dopo l'inserimento</FormDescription>
                  <FormMessage />
                </FormItem>} />
            <FormField control={form.control} name="metodo" render={({
            field
          }) => <FormItem>
                  <FormLabel>Metodo *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona metodo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {QUICK_BET_METHODS.map(metodo => <SelectItem key={metodo} value={metodo}>
                          {metodo}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>} />
            <FormField control={form.control} name="movimento" render={({
            field
          }) => <FormItem>
                  <FormLabel>Movimento *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                    </div>
                  </FormControl>
                  <FormDescription></FormDescription>
                  <FormMessage />
                </FormItem>} />
            <FormField control={form.control} name="registrato" render={({
            field
          }) => <FormItem className="flex flex-col">
                  <FormLabel>Registrato *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                          {field.value ? format(field.value, 'dd/MM/yyyy HH:mm') : <span>Seleziona data</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3 border-b">
                        <TimePicker value={field.value} onChange={field.onChange} />
                      </div>
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>} />
            <FormField control={form.control} name="note" render={({
            field
          }) => <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Note aggiuntive..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />
            <FormField control={form.control} name="tag" render={({
            field
          }) => <FormItem>
                  <FormLabel>Tag{settings.tag && ' *'}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={settings.tag ? "Seleziona tag" : "Seleziona tag (opzionale)"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {!settings.tag && <SelectItem value="none">Nessuno</SelectItem>}
                      {tags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.nome}>
                          {tag.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Chiudi
              </Button>
              <Button type="submit">Salva</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>;
}