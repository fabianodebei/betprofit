-- Add public/shared book functionality
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- Create a view for public books that users can add
CREATE OR REPLACE VIEW public.available_public_books AS
SELECT DISTINCT ON (nome, metodo)
  nome,
  metodo,
  'Bookmaker' as categoria
FROM public.books
WHERE is_public = true AND stato = 'Abilitato'
ORDER BY nome, metodo, created_at DESC;

-- Function to add a public book to a user's collection
CREATE OR REPLACE FUNCTION public.add_public_book_to_user(
  _book_nome text,
  _book_metodo text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_book_id uuid;
BEGIN
  -- Check if user already has this book
  IF EXISTS (
    SELECT 1 FROM public.books 
    WHERE user_id = auth.uid() 
    AND nome = _book_nome 
    AND metodo = _book_metodo
  ) THEN
    RAISE EXCEPTION 'You already have this book in your collection';
  END IF;

  -- Insert the book for the user
  INSERT INTO public.books (user_id, nome, metodo, stato, predefinito, is_public)
  VALUES (auth.uid(), _book_nome, _book_metodo, 'Abilitato', false, false)
  RETURNING id INTO new_book_id;

  RETURN new_book_id;
END;
$$;

-- Make default books public so they appear in the available list
UPDATE public.books 
SET is_public = true 
WHERE nome IN (
  'Bet365', 'William Hill', 'Unibet', '888sport', 'Betway',
  'Snai', 'Sisal', 'Eurobet', 'Betfair', 'Betflag',
  'Goldbet', 'Lottomatica', 'Better', 'NetBet', 'Betsson', 'Admiral'
);