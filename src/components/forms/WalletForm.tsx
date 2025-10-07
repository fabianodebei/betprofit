import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useWallets } from '@/contexts/WalletContext';

const walletSchema = z.object({
  intestatario: z.string().min(1, 'Intestatario è obbligatorio'),
  nome: z.string().min(1, 'Nome è obbligatorio'),
  descrizione: z.string().optional(),
  stato: z.enum(['Abilitato', 'Disabilitato']),
});

type WalletFormData = z.infer<typeof walletSchema>;

interface WalletFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletForm({ open, onOpenChange }: WalletFormProps) {
  const { addWallet } = useWallets();

  const form = useForm<WalletFormData>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      intestatario: '',
      nome: '',
      descrizione: '',
      stato: 'Abilitato',
    },
  });

  const onSubmit = async (data: WalletFormData) => {
    await addWallet({
      intestatario: data.intestatario,
      nome: data.nome,
      descrizione: data.descrizione,
      stato: data.stato,
      saldoAttuale: 0,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuovo Wallet</DialogTitle>
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
                    <Input placeholder="Es: Mario Rossi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Es: PayPal" {...field} />
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
                    <SelectContent>
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
