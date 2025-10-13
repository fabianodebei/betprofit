-- Update handle_new_user to set is_public for default books
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- Assign default 'free' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'free');
  
  -- Insert predefined bookmakers for the new user with is_public = true
  INSERT INTO public.books (user_id, nome, metodo, stato, predefinito, is_public) VALUES
    (NEW.id, 'Bet365', 'Bookmaker', 'Abilitato', false, true),
    (NEW.id, 'William Hill', 'Bookmaker', 'Abilitato', false, true),
    (NEW.id, 'Unibet', 'Bookmaker', 'Abilitato', false, true),
    (NEW.id, '888sport', 'Bookmaker', 'Abilitato', false, true),
    (NEW.id, 'Betway', 'Bookmaker', 'Abilitato', false, true),
    (NEW.id, 'Snai', 'Bookmaker', 'Abilitato', false, true),
    (NEW.id, 'Sisal', 'Bookmaker', 'Abilitato', false, true),
    (NEW.id, 'Eurobet', 'Bookmaker', 'Abilitato', false, true),
    (NEW.id, 'Betfair', 'Bookmaker', 'Abilitato', false, true),
    (NEW.id, 'Betfair', 'Exchange', 'Abilitato', false, true),
    (NEW.id, 'Betflag', 'Bookmaker', 'Abilitato', false, true),
    (NEW.id, 'Betflag', 'Exchange', 'Abilitato', false, true),
    (NEW.id, 'Goldbet', 'Bookmaker', 'Abilitato', false, true),
    (NEW.id, 'Lottomatica', 'Bookmaker', 'Abilitato', false, true),
    (NEW.id, 'Better', 'Bookmaker', 'Abilitato', false, true),
    (NEW.id, 'NetBet', 'Bookmaker', 'Abilitato', false, true),
    (NEW.id, 'Betsson', 'Bookmaker', 'Abilitato', false, true),
    (NEW.id, 'Admiral', 'Bookmaker', 'Abilitato', false, true);
  
  RETURN NEW;
END;
$function$;