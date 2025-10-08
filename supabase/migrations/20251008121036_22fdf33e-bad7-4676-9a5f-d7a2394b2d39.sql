-- Fix security issue: set search_path for the function
DROP FUNCTION IF EXISTS public.ensure_single_predefinito_intestatario() CASCADE;

CREATE OR REPLACE FUNCTION public.ensure_single_predefinito_intestatario()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.predefinito = true THEN
    UPDATE public.intestatari 
    SET predefinito = false 
    WHERE id != NEW.id AND predefinito = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_predefinito_intestatario_trigger
BEFORE INSERT OR UPDATE ON public.intestatari
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_predefinito_intestatario();