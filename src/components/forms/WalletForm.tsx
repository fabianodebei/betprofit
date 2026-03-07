import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { z } from 'zod';
import { useEffect, useMemo, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useWallets } from '@/contexts/WalletContext';
import { useIntestatari } from '@/contexts/IntestatariContext';
import { Wallet } from '@/types';

const PREDEFINED_WALLETS = [
  { value: 'PayPal', label: 'PayPal' },
  { value: 'Visa', label: 'Visa' },
  { value: 'Mastercard', label: 'Mastercard' },
  { value: 'Skrill', label: 'Skrill' },
  { value: 'custom', label: 'Inserisci manualmente' },
];

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
  editingWallet?: Wallet | null;
}

export function WalletForm({ open, onOpenChange, editingWallet }: WalletFormProps) {
  const { addWallet, updateWallet } = useWallets();
  const { intestatari } = useIntestatari();
  const [walletType, setWalletType] = useState<string>('PayPal');

  const availableIntestatari = useMemo(() => {
    return intestatari
      .filter(int => int.stato === 'Abilitato')
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [intestatari]);

  const form = useForm<WalletFormData>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      intestatario: '',
      nome: '',
      descrizione: '',
      stato: 'Abilitato',
    },
  });

  useEffect(() => {
    if (editingWallet && open) {
      const isPredefined = PREDEFINED_WALLETS.some(w => w.value === editingWallet.nome);
      setWalletType(isPredefined ? editingWallet.nome : 'custom');
      form.reset({
        intestatario: editingWallet.intestatario,
        nome: editingWallet.nome,
        descrizione: editingWallet.descrizione || '',
        stato: editingWallet.stato,
      });
    } else if (!open) {
      setWalletType('PayPal');
      form.reset({
        intestatario: '',
        nome: '',
        descrizione: '',
        stato: 'Abilitato',
      });
    }
  }, [editingWallet, open, form]);

  // Sync walletType selection to form nome field
  useEffect(() => {
    if (walletType !== 'custom') {
      form.setValue('nome', walletType);
    } else if (!editingWallet) {
      form.setValue('nome', '');
    }
  }, [walletType, form, editingWallet]);

  const onSubmit = async (data: WalletFormData) => {
    if (editingWallet) {
      await updateWallet(editingWallet.id, {
        intestatario: data.intestatario,
        nome: data.nome,
        descrizione: data.descrizione,
        stato: data.stato,
      });
    } else {
      await addWallet({
        intestatario: data.intestatario,
        nome: data.nome,
        descrizione: data.descrizione,
        stato: data.stato,
        saldoAttuale: 0,
      });
    }
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingWallet ? 'Modifica Wallet' : 'Nuovo Wallet'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="intestatario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intestatario *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona intestatario" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableIntestatari.map((int) => (
                        <SelectItem key={int.id} value={int.nome}>
                          {int.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Wallet type selection */}
            <FormItem>
              <FormLabel>Tipo Wallet *</FormLabel>
              <Select value={walletType} onValueChange={setWalletType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipo wallet" />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_WALLETS.map((w) => (
                    <SelectItem key={w.value} value={w.value}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>

            {/* Manual name input only when custom */}
            {walletType === 'custom' && (
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Wallet *</FormLabel>
                    <FormControl>
                      <Input placeholder="Es: Postepay, Bonifico..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
