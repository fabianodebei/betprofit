-- Remove the global unique constraint on books.nome
ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_nome_key;

-- Add a unique constraint on (user_id, nome) to allow same names for different users
ALTER TABLE public.books ADD CONSTRAINT books_user_nome_unique UNIQUE (user_id, nome);