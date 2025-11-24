import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Tag {
  id: string;
  nome: string;
  created_at: Date;
}

interface TagContextType {
  tags: Tag[];
  loading: boolean;
  addTag: (tag: Omit<Tag, 'id' | 'created_at'>) => Promise<void>;
  updateTag: (id: string, tag: Partial<Omit<Tag, 'id' | 'created_at'>>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
}

const TagContext = createContext<TagContextType | undefined>(undefined);

export const useTags = () => {
  const context = useContext(TagContext);
  if (!context) {
    throw new Error('useTags must be used within a TagProvider');
  }
  return context;
};

export const TagProvider = ({ children }: { children: ReactNode }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTags = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('nome', { ascending: true });

      if (error) throw error;

      setTags(data.map(tag => ({
        ...tag,
        created_at: new Date(tag.created_at)
      })));
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTags();

      const channel = supabase
        .channel('tags-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tags',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchTags();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setTags([]);
      setLoading(false);
    }
  }, [user]);

  const addTag = async (tag: Omit<Tag, 'id' | 'created_at'>) => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('tags')
        .insert([{ ...tag, user_id: user.id }]);

      if (error) throw error;

      await fetchTags();
    } catch (error: any) {
      console.error('Error adding tag:', error);
      throw error;
    }
  };

  const updateTag = async (id: string, tag: Partial<Omit<Tag, 'id' | 'created_at'>>) => {
    try {
      const { error } = await supabase
        .from('tags')
        .update(tag)
        .eq('id', id);

      if (error) throw error;

      await fetchTags();
    } catch (error: any) {
      console.error('Error updating tag:', error);
      throw error;
    }
  };

  const deleteTag = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchTags();
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  };

  return (
    <TagContext.Provider value={{ tags, loading, addTag, updateTag, deleteTag }}>
      {children}
    </TagContext.Provider>
  );
};
