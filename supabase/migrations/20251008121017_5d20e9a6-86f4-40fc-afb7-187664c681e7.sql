-- Create intestatari table
CREATE TABLE public.intestatari (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL UNIQUE,
  descrizione text,
  stato text NOT NULL DEFAULT 'Abilitato',
  predefinito boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.intestatari ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access (same pattern as other tables)
CREATE POLICY "Allow all access to intestatari" 
ON public.intestatari 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger to ensure only one predefinito can be true at a time
CREATE OR REPLACE FUNCTION public.ensure_single_predefinito_intestatario()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.predefinito = true THEN
    UPDATE public.intestatari 
    SET predefinito = false 
    WHERE id != NEW.id AND predefinito = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_predefinito_intestatario_trigger
BEFORE INSERT OR UPDATE ON public.intestatari
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_predefinito_intestatario();