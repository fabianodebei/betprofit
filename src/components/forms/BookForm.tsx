import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Book } from '@/contexts/BookContext';

const formSchema = z.object({
  nome: z.string().min(1, 'Il nome è obbligatorio'),
  metodo: z.string().min(1, 'Il metodo è obbligatorio'),
  stato: z.enum(['Abilitato', 'Disabilitato']),
});

type FormData = z.infer<typeof formSchema>;

interface BookFormProps {
  book?: Book;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

export const BookForm = ({ book, onSubmit, onCancel }: BookFormProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: book?.nome || '',
      metodo: book?.metodo || 'Bookmaker',
      stato: book?.stato || 'Abilitato',
    },
  });

  const handleSubmit = async (data: FormData) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      // Error is handled in the context
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome del book" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="metodo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Metodo</FormLabel>
              <FormControl>
                <Input placeholder="Metodo" {...field} />
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
              <FormLabel>Stato</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona stato" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Abilitato">Abilitato</SelectItem>
                  <SelectItem value="Disabilitato">Disabilitato</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annulla
          </Button>
          <Button type="submit">
            {book ? 'Aggiorna' : 'Crea'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
