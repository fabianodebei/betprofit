import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useAccounts } from '@/contexts/AccountContext';
import { Account } from '@/types';

const BOOKMAKERS = [
  'Betfair.it',
  'Planetwin365.it',
  'Lottomatica.it',
  'WilliamHill.it',
  'Bet365.it',
  'BetFlag.it',
  'Snai.it',
  'GoldBet.it',
  'Sisal.it',
  'Eurobet.it',
  'LeoVegas.it',
  'Stanleybet.it',
  'Unibet.it',
  'StarCasino.it',
  'E-Play24.it',
  'Eplay24',
  'Vincitu',
  '888 casino',
];

const accountSchema = z.object({
  intestatario: z.string().min(1, 'Intestatario è obbligatorio'),
  conto: z.string().min(1, 'Nome conto è obbligatorio'),
  descrizione: z.string().optional(),
  stato: z.enum(['Abilitato', 'Disabilitato']),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAccount?: Account | null;
}

export function AccountForm({ open, onOpenChange, editingAccount }: AccountFormProps) {
  const { addAccount, updateAccount, accounts } = useAccounts();

  // Lista bookmaker statica dalla richiesta, ordinata alfabeticamente (case-insensitive, locale IT)
  const bookmakers = [...BOOKMAKERS].sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }));

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      intestatario: '',
      conto: '',
      descrizione: '',
      stato: 'Abilitato',
    },
  });

  useEffect(() => {
    if (editingAccount && open) {
      form.reset({
        intestatario: editingAccount.intestatario,
        conto: editingAccount.conto,
        descrizione: editingAccount.descrizione || '',
        stato: editingAccount.stato,
      });
    } else if (!open) {
      form.reset({
        intestatario: '',
        conto: '',
        descrizione: '',
        stato: 'Abilitato',
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
      });
    } else {
      await addAccount({
        intestatario: data.intestatario,
        conto: data.conto,
        descrizione: data.descrizione,
        stato: data.stato,
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
          <DialogDescription className="sr-only">Compila i campi per creare o modificare un conto bookmaker.</DialogDescription>
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
                    <div className="relative">
                      <Input 
                        placeholder="Inserisci o seleziona intestatario" 
                        list="intestatari-list"
                        {...field}
                      />
                      <datalist id="intestatari-list">
                        {[...new Set(accounts.map(a => a.intestatario))]
                          .sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }))
                          .map((intestatario) => (
                            <option key={intestatario} value={intestatario} />
                          ))}
                      </datalist>
                    </div>
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
                    <SelectContent position="popper" className="z-[70] max-h-[240px] bg-popover">
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
                    <SelectContent position="popper">
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
