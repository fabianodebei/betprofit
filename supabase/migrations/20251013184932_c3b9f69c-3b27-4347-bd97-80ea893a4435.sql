-- Fix signup failure: allow same book name with different metodo per user
ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_user_nome_unique;
ALTER TABLE public.books ADD CONSTRAINT books_user_nome_unique UNIQUE (user_id, nome, metodo);