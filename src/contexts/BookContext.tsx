import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useImpersonation } from './ImpersonationContext';

export interface Book {
  id: string;
  nome: string;
  metodo: string;
  stato: 'Abilitato' | 'Disabilitato';
  predefinito: boolean;
  created_at: Date;
  is_public?: boolean;
  user_id?: string;
}

export interface PublicBook {
  nome: string;
  metodo: string;
}

interface BookContextType {
  books: Book[];
  loading: boolean;
  addBook: (book: Omit<Book, 'id' | 'created_at'>) => Promise<void>;
  updateBook: (id: string, book: Partial<Omit<Book, 'id' | 'created_at'>>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  getPublicBooks: () => Promise<PublicBook[]>;
  addPublicBook: (nome: string, metodo: string) => Promise<void>;
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
  const { user } = useAuth();
  const { effectiveUserId } = useImpersonation();

  const fetchBooks = async () => {
    if (!user) {
      setBooks([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch user's own books AND public books
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .order('nome', { ascending: true });

      if (error) throw error;

      setBooks(data.map(book => ({
        ...book,
        stato: book.stato as 'Abilitato' | 'Disabilitato',
        predefinito: book.predefinito || false,
        created_at: new Date(book.created_at)
      })));
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBooks();

      const channel = supabase
        .channel('books-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'books',
            filter: `user_id=eq.${effectiveUserId}`
          },
          () => {
            fetchBooks();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, effectiveUserId]);

  const addBook = async (book: Omit<Book, 'id' | 'created_at'>) => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('books')
        .insert([{ ...book, user_id: effectiveUserId }]);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error adding book:', error);
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
    } catch (error: any) {
      console.error('Error updating book:', error);
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
    } catch (error: any) {
      console.error('Error deleting book:', error);
      throw error;
    }
  };

  const getPublicBooks = async (): Promise<PublicBook[]> => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('nome, metodo')
        .eq('is_public', true)
        .eq('stato', 'Abilitato');

      if (error) throw error;

      // Rimuovi duplicati
      const uniqueBooks = Array.from(
        new Map(data.map(book => [`${book.nome}-${book.metodo}`, book])).values()
      );

      return uniqueBooks;
    } catch (error: any) {
      console.error('Error fetching public books:', error);
      return [];
    }
  };

  const addPublicBook = async (nome: string, metodo: string) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('add_public_book_to_user', {
        _book_nome: nome,
        _book_metodo: metodo
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error adding public book:', error);
      throw error;
    }
  };

  return (
    <BookContext.Provider value={{ books, loading, addBook, updateBook, deleteBook, getPublicBooks, addPublicBook }}>
      {children}
    </BookContext.Provider>
  );
};
