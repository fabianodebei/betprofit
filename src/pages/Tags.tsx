import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTags, Tag } from '@/contexts/TagContext';
import { TagForm } from '@/components/forms/TagForm';

export default function Tags() {
  const navigate = useNavigate();
  const { tags, loading, addTag, updateTag, deleteTag } = useTags();
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  const handleFormSubmit = async (data: Omit<Tag, 'id' | 'created_at'>) => {
    if (selectedTag) {
      await updateTag(selectedTag.id, data);
    } else {
      await addTag(data);
    }
    setIsFormOpen(false);
    setSelectedTag(null);
  };

  const handleEdit = (tag: Tag) => {
    setSelectedTag(tag);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (tag: Tag) => {
    setTagToDelete(tag);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (tagToDelete) {
      await deleteTag(tagToDelete.id);
      setIsDeleteDialogOpen(false);
      setTagToDelete(null);
    }
  };

  const handleNewTag = () => {
    setSelectedTag(null);
    setIsFormOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tag Personali</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/impostazioni')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alle Impostazioni
          </Button>
          <Button onClick={handleNewTag}>Nuovo Tag</Button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Visualizzo {tags.length} di {tags.length} elementi.
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Opzioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  Caricamento...
                </TableCell>
              </TableRow>
            ) : tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  Nessun tag trovato
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag, index) => (
                <TableRow key={tag.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{tag.nome}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleEdit(tag)}
                      className="text-primary"
                    >
                      Modifica
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleDeleteClick(tag)}
                      className="text-destructive"
                    >
                      Elimina
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTag ? 'Modifica Tag' : 'Nuovo Tag'}</DialogTitle>
            <DialogDescription>
              {selectedTag ? 'Modifica il nome del tag' : 'Inserisci il nome del nuovo tag'}
            </DialogDescription>
          </DialogHeader>
          <TagForm
            tag={selectedTag || undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedTag(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il tag "{tagToDelete?.nome}"? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
