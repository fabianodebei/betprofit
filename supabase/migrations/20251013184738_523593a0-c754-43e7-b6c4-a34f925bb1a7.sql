-- Drop the incorrect unique constraint
ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_user_nome_unique;

-- Add the correct unique constraint on (user_id, nome)
-- This allows multiple users to have bookmakers with the same name
ALTER TABLE public.books ADD CONSTRAINT books_user_nome_unique UNIQUE (user_id, nome);