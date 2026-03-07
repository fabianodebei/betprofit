import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useAccounts } from '@/contexts/AccountContext';
import { useBooks } from '@/contexts/BookContext';
import { useIntestatari } from '@/contexts/IntestatariContext';
import { Account } from '@/types';

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
  const { addAccount, updateAccount } = useAccounts();
  const { books } = useBooks();
  const { intestatari } = useIntestatari();

  // Lista book dalla tabella, solo abilitati, ordinati alfabeticamente - si aggiorna automaticamente
  const availableBooks = useMemo(() => 
    books
      .filter(book => book.stato === 'Abilitato')
      .sort((a, b) => a.nome.localeCompare(b.nome, 'it', { sensitivity: 'base' })),
    [books]
  );

  // Lista intestatari abilitati, ordinati alfabeticamente
  const availableIntestatari = useMemo(() =>
    intestatari
      .filter(int => int.stato === 'Abilitato')
      .sort((a, b) => a.nome.localeCompare(b.nome, 'it', { sensitivity: 'base' })),
    [intestatari]
  );

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
      // Trova il book predefinito
      const defaultBook = books.find(book => book.predefinito && book.stato === 'Abilitato');
      
      form.reset({
        intestatario: '',
        conto: defaultBook?.nome || '',
        descrizione: '',
        stato: 'Abilitato',
      });
    }
  }, [editingAccount, open, form, books]);

  const onSubmit = async (data: AccountFormData) => {
    if (editingAccount) {
      await updateAccount(editingAccount.id, {
        intestatario: data.intestatario,
        conto: data.conto,
        descrizione: data.descrizione,
        stato: data.stato,
      });
    } else {
      // Se esiste già un conto con lo stesso book ma intestatario diverso, disambigua il nome
      const existingWithSameBook = accounts.filter(a => a.conto === data.conto || a.conto.startsWith(data.conto + ' - '));
      const hasDifferentIntestatario = existingWithSameBook.some(a => a.intestatario !== data.intestatario);
      const hasSameIntestatario = existingWithSameBook.some(a => a.intestatario === data.intestatario);
      
      let contoName = data.conto;
      if (hasDifferentIntestatario || hasSameIntestatario) {
        // Sempre disambigua se ci sono già conti con lo stesso book
        contoName = `${data.conto} - ${data.intestatario}`;
        
        // Rinomina anche i conti esistenti con lo stesso book che non hanno ancora il suffisso
        for (const existing of existingWithSameBook) {
          if (existing.conto === data.conto) {
            const newName = `${data.conto} - ${existing.intestatario}`;
            await updateAccount(existing.id, { conto: newName });
          }
        }
      }
      
      await addAccount({
        intestatario: data.intestatario,
        conto: contoName,
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
                        {availableIntestatari.map((intestatario) => (
                          <option key={intestatario.id} value={intestatario.nome} />
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
                      {availableBooks.map((book) => (
                        <SelectItem key={book.id} value={book.nome}>
                          {book.nome}
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