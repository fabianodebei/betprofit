import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBooks, PublicBook } from '@/contexts/BookContext';
import { Plus, Search } from 'lucide-react';

export const AddPublicBookDialog = () => {
  const { getPublicBooks, addPublicBook } = useBooks();
  const [open, setOpen] = useState(false);
  const [publicBooks, setPublicBooks] = useState<PublicBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    const books = await getPublicBooks();
    setPublicBooks(books);
    setLoading(false);
  };

  const handleAddBook = async (nome: string, metodo: string) => {
    try {
      await addPublicBook(nome, metodo);
      setOpen(false);
    } catch (error) {
      // Error is handled in context
    }
  };

  const filteredBooks = publicBooks.filter(book =>
    book.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.metodo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={handleOpen}>
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Book Pubblico
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Aggiungi Book Pubblico</DialogTitle>
          <DialogDescription>
            Seleziona un book dalla lista di quelli disponibili pubblicamente
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per nome o metodo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Metodo</TableHead>
                <TableHead className="text-right">Azione</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Caricamento...
                  </TableCell>
                </TableRow>
              ) : filteredBooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    {searchTerm ? 'Nessun book trovato' : 'Nessun book pubblico disponibile'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredBooks.map((book, index) => (
                  <TableRow key={`${book.nome}-${book.metodo}-${index}`}>
                    <TableCell className="font-medium">{book.nome}</TableCell>
                    <TableCell>{book.metodo}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleAddBook(book.nome, book.metodo)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Aggiungi
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
