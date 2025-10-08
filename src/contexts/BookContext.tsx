import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Book {
  id: string;
  nome: string;
  metodo: string;
  stato: 'Abilitato' | 'Disabilitato';
  created_at: Date;
}

interface BookContextType {
  books: Book[];
  loading: boolean;
  addBook: (book: Omit<Book, 'id' | 'created_at'>) => Promise<void>;
  updateBook: (id: string, book: Partial<Omit<Book, 'id' | 'created_at'>>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

export const useBooks = () => {
  const context = useContext(BookContext);
  if (!context) {
    throw new Error('useBooks must be used within a BookProvider');
  }
  return context;
};

export const BookProvider = ({ children }: { children: ReactNode }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;

      setBooks(data.map(book => ({
        ...book,
        stato: book.stato as 'Abilitato' | 'Disabilitato',
        created_at: new Date(book.created_at)
      })));
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i book',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();

    const channel = supabase
      .channel('books-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'books'
        },
        () => {
          fetchBooks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addBook = async (book: Omit<Book, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('books')
        .insert([book]);

      if (error) throw error;

      toast({
        title: 'Successo',
        description: 'Book aggiunto con successo',
      });
    } catch (error: any) {
      console.error('Error adding book:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile aggiungere il book',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateBook = async (id: string, book: Partial<Omit<Book, 'id' | 'created_at'>>) => {
    try {
      const { error } = await supabase
        .from('books')
        .update(book)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Successo',
        description: 'Book aggiornato con successo',
      });
    } catch (error: any) {
      console.error('Error updating book:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile aggiornare il book',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteBook = async (id: string) => {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Successo',
        description: 'Book eliminato con successo',
      });
    } catch (error: any) {
      console.error('Error deleting book:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile eliminare il book',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <BookContext.Provider value={{ books, loading, addBook, updateBook, deleteBook }}>
      {children}
    </BookContext.Provider>
  );
};
