import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Intestatario, useIntestatari } from '@/contexts/IntestatariContext';

const intestatarioSchema = z.object({
  nome: z.string().trim().min(1, 'Il nome è obbligatorio').max(100, 'Il nome deve essere meno di 100 caratteri'),
  descrizione: z.string().max(500, 'La descrizione deve essere meno di 500 caratteri').optional(),
  stato: z.enum(['Abilitato', 'Disabilitato']),
  predefinito: z.boolean(),
});

type IntestatarioFormData = z.infer<typeof intestatarioSchema>;

type IntestatarioFormProps = {
  intestatario?: Intestatario;
  onSuccess: () => void;
};

export function IntestatarioForm({ intestatario, onSuccess }: IntestatarioFormProps) {
  const { addIntestatario, updateIntestatario } = useIntestatari();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<IntestatarioFormData>({
    resolver: zodResolver(intestatarioSchema),
    defaultValues: {
      nome: intestatario?.nome || '',
      descrizione: intestatario?.descrizione || '',
      stato: intestatario?.stato || 'Abilitato',
      predefinito: intestatario?.predefinito || false,
    },
  });

  useEffect(() => {
    if (intestatario) {
      form.reset({
        nome: intestatario.nome,
        descrizione: intestatario.descrizione || '',
        stato: intestatario.stato,
        predefinito: intestatario.predefinito,
      });
    }
  }, [intestatario, form]);

  const onSubmit = async (data: IntestatarioFormData) => {
    setIsSubmitting(true);
    try {
      if (intestatario) {
        await updateIntestatario(intestatario.id, data);
      } else {
        await addIntestatario({
          nome: data.nome,
          descrizione: data.descrizione,
          stato: data.stato,
          predefinito: data.predefinito,
        });
      }
      onSuccess();
    } catch (error) {
      // Error handling is done in the context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="Nome intestatario" {...field} />
              </FormControl>
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
                <Textarea placeholder="Descrizione intestatario" {...field} />
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
              <Select onValueChange={field.onChange} value={field.value}>
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

        <FormField
          control={form.control}
          name="predefinito"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Intestatario Predefinito
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  Imposta come intestatario predefinito
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvataggio...' : intestatario ? 'Aggiorna' : 'Crea'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
