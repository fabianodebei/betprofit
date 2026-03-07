import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tag } from '@/contexts/TagContext';

const formSchema = z.object({
  nome: z.string().min(1, 'Il nome è obbligatorio'),
});

type FormData = z.infer<typeof formSchema>;

interface TagFormProps {
  tag?: Tag;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

export const TagForm = ({ tag, onSubmit, onCancel }: TagFormProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: tag?.nome || '',
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
                <Input placeholder="Nome del tag" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Chiudi
          </Button>
          <Button type="submit">
            Salva
          </Button>
        </div>
      </form>
    </Form>
  );
};
