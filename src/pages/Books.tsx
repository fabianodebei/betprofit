import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useBooks, Book } from '@/contexts/BookContext';
import { useAuth } from '@/contexts/AuthContext';
import { BookForm } from '@/components/forms/BookForm';
import { Badge } from '@/components/common/Badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, ArrowLeft, Globe } from 'lucide-react';
import { AddPublicBookDialog } from '@/components/forms/AddPublicBookDialog';
export default function Books() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    books,
    loading,
    addBook,
    updateBook,
    deleteBook
  } = useBooks();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  // Filters
  const [nomeFilter, setNomeFilter] = useState('');
  const [metodoFilter, setMetodoFilter] = useState('');
  const [statoFilter, setStatoFilter] = useState('');
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesNome = !nomeFilter || book.nome.toLowerCase().includes(nomeFilter.toLowerCase());
      const matchesMetodo = !metodoFilter || book.metodo.toLowerCase().includes(metodoFilter.toLowerCase());
      const matchesStato = !statoFilter || statoFilter === 'all' || book.stato === statoFilter;
      return matchesNome && matchesMetodo && matchesStato;
    });
  }, [books, nomeFilter, metodoFilter, statoFilter]);
  const handleFormSubmit = async (data: Omit<Book, 'id' | 'created_at'>) => {
    if (selectedBook) {
      await updateBook(selectedBook.id, data);
    } else {
      await addBook(data);
    }
    setIsFormOpen(false);
    setSelectedBook(null);
  };
  const handleEdit = (book: Book) => {
    setSelectedBook(book);
    setIsFormOpen(true);
  };
  const handleDeleteClick = (book: Book) => {
    setBookToDelete(book);
    setIsDeleteDialogOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (bookToDelete) {
      await deleteBook(bookToDelete.id);
      setIsDeleteDialogOpen(false);
      setBookToDelete(null);
    }
  };
  const handleNewBook = () => {
    setSelectedBook(null);
    setIsFormOpen(true);
  };
  return <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Book Personali</h1>
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => navigate('/impostazioni')}>
             <ArrowLeft className="h-4 w-4 mr-2" />
             Torna alle Impostazioni
           </Button>
           <Button onClick={handleNewBook}>Nuovo Book</Button>
         </div>
      </div>

      

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Nome</label>
          <Input placeholder="Filtra per nome" value={nomeFilter} onChange={e => setNomeFilter(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Metodo</label>
          <Input placeholder="Filtra per metodo" value={metodoFilter} onChange={e => setMetodoFilter(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Stato</label>
          <Select value={statoFilter} onValueChange={setStatoFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tutti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="Abilitato">Abilitato</SelectItem>
              <SelectItem value="Disabilitato">Disabilitato</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Visualizzo {filteredBooks.length} di {books.length} elementi.
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Metodo</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="text-right">Opzioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Caricamento...
                </TableCell>
              </TableRow> : filteredBooks.length === 0 ? <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Nessun book trovato
                </TableCell>
              </TableRow> : filteredBooks.map((book, index) => {
                  const isPublic = book.is_public && book.user_id !== user?.id;
                  return <TableRow key={book.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {book.nome}
                        {isPublic && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            <Globe className="h-3 w-3" />
                            Pubblico
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{book.metodo}</TableCell>
                    <TableCell>
                      <Badge variant={book.stato === 'Abilitato' ? 'success' : 'default'}>
                        {book.stato.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {!isPublic && (
                        <>
                          <Button variant="link" size="sm" onClick={() => handleEdit(book)} className="text-primary">
                            Modifica
                          </Button>
                          <Button variant="link" size="sm" onClick={() => handleDeleteClick(book)} className="text-destructive">
                            Elimina
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>;
                })}
          </TableBody>
        </Table>
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedBook ? 'Modifica Book' : 'Nuovo Book'}</DialogTitle>
            <DialogDescription>
              {selectedBook ? 'Modifica i dati del book' : 'Inserisci i dati del nuovo book'}
            </DialogDescription>
          </DialogHeader>
          <BookForm book={selectedBook || undefined} onSubmit={handleFormSubmit} onCancel={() => {
          setIsFormOpen(false);
          setSelectedBook(null);
        }} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il book "{bookToDelete?.nome}"? Questa azione non può essere annullata.
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
    </div>;
}