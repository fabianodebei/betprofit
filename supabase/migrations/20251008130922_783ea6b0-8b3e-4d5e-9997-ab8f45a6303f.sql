-- Add predefinito column to books table
ALTER TABLE public.books ADD COLUMN predefinito boolean NOT NULL DEFAULT false;

-- Create function to ensure only one predefinito book
CREATE OR REPLACE FUNCTION public.ensure_single_predefinito_book()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.predefinito = true THEN
    UPDATE public.books 
    SET predefinito = false 
    WHERE id != NEW.id AND predefinito = true;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for books predefinito
CREATE TRIGGER ensure_single_predefinito_book_trigger
BEFORE INSERT OR UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_predefinito_book();