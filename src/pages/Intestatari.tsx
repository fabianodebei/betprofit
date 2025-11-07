import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useIntestatari } from '@/contexts/IntestatariContext';
import { IntestatarioForm } from '@/components/forms/IntestatarioForm';
import { Intestatario } from '@/contexts/IntestatariContext';

export default function Intestatari() {
  const navigate = useNavigate();
  const { intestatari, loading, deleteIntestatario } = useIntestatari();
  const [filterNome, setFilterNome] = useState('');
  const [filterDescrizione, setFilterDescrizione] = useState('');
  const [filterStato, setFilterStato] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIntestatario, setEditingIntestatario] = useState<Intestatario | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredIntestatari = useMemo(() => {
    return intestatari.filter(int => {
      if (filterNome && !int.nome.toLowerCase().includes(filterNome.toLowerCase())) return false;
      if (filterDescrizione && int.descrizione && !int.descrizione.toLowerCase().includes(filterDescrizione.toLowerCase())) return false;
      if (filterStato && int.stato !== filterStato) return false;
      return true;
    });
  }, [intestatari, filterNome, filterDescrizione, filterStato]);

  const handleEdit = (intestatario: Intestatario) => {
    setEditingIntestatario(intestatario);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setEditingIntestatario(undefined);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingIntestatario(undefined);
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteIntestatario(deleteId);
        setDeleteId(null);
      } catch (error) {
        // Error handling is done in the context
      }
    }
  };

  const handleNewWallet = (intestatario: Intestatario) => {
    navigate('/wallets', { state: { intestatario: intestatario.nome } });
  };

  const handleNewAccount = (intestatario: Intestatario) => {
    navigate('/conti', { state: { intestatario: intestatario.nome } });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary p-3">
            <Users className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Intestatari</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/impostazioni')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alle Impostazioni
          </Button>
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Intestatario
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 text-sm text-muted-foreground">
            Visualizzo 1-{filteredIntestatari.length} di {intestatari.length} elementi.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="p-3 text-left text-xs font-semibold w-12">#</th>
                  <th className="p-3 text-left text-xs font-semibold">Nome</th>
                  <th className="p-3 text-left text-xs font-semibold">Descrizione</th>
                  <th className="p-3 text-left text-xs font-semibold">Stato</th>
                  <th className="p-3 text-left text-xs font-semibold">Predefinito</th>
                  <th className="p-3 text-left text-xs font-semibold">Opzioni</th>
                </tr>
                <tr className="border-b bg-muted/50">
                  <th className="p-2"></th>
                  <th className="p-2">
                    <Input
                      placeholder="Filtra Nome"
                      value={filterNome}
                      onChange={(e) => setFilterNome(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </th>
                  <th className="p-2">
                    <Input
                      placeholder="Filtra Descrizione"
                      value={filterDescrizione}
                      onChange={(e) => setFilterDescrizione(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </th>
                  <th className="p-2">
                    <Select value={filterStato} onValueChange={setFilterStato}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Seleziona Stato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" ">Tutti</SelectItem>
                        <SelectItem value="Abilitato">Abilitato</SelectItem>
                        <SelectItem value="Disabilitato">Disabilitato</SelectItem>
                      </SelectContent>
                    </Select>
                  </th>
                  <th className="p-2"></th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredIntestatari.map((int, idx) => (
                  <tr key={int.id} className="border-b hover:bg-muted/20">
                    <td className="p-3 text-sm">{idx + 1}</td>
                    <td className="p-3 text-sm">{int.nome}</td>
                    <td className="p-3 text-sm">{int.descrizione || '-'}</td>
                    <td className="p-3 text-sm">
                      <Badge variant={int.stato === 'Abilitato' ? 'default' : 'secondary'}>
                        {int.stato}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">
                      {int.predefinito ? (
                        <Badge className="bg-green-500 hover:bg-green-600">SI</Badge>
                      ) : (
                        <span className="text-muted-foreground">NO</span>
                      )}
                    </td>
                    <td className="p-3 text-sm">
                      <div className="flex gap-2">
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-primary"
                          onClick={() => handleNewWallet(int)}
                        >
                          Nuovo Wallet
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-primary"
                          onClick={() => handleNewAccount(int)}
                        >
                          Nuovo Conto
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-primary"
                          onClick={() => handleEdit(int)}
                        >
                          Modifica
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-destructive"
                          onClick={() => setDeleteId(int.id)}
                        >
                          Elimina
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingIntestatario ? 'Modifica Intestatario' : 'Nuovo Intestatario'}
            </DialogTitle>
          </DialogHeader>
          <IntestatarioForm
            intestatario={editingIntestatario}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. L'intestatario verrà eliminato permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
