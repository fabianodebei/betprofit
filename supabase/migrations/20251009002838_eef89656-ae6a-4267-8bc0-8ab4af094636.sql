-- Update the handle_new_user function to include predefined bookmakers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  
  -- Insert predefined bookmakers for the new user
  INSERT INTO public.books (user_id, nome, metodo, stato, predefinito) VALUES
    (NEW.id, 'Bet365', 'Bookmaker', 'Abilitato', false),
    (NEW.id, 'William Hill', 'Bookmaker', 'Abilitato', false),
    (NEW.id, 'Unibet', 'Bookmaker', 'Abilitato', false),
    (NEW.id, '888sport', 'Bookmaker', 'Abilitato', false),
    (NEW.id, 'Betway', 'Bookmaker', 'Abilitato', false),
    (NEW.id, 'Snai', 'Bookmaker', 'Abilitato', false),
    (NEW.id, 'Sisal', 'Bookmaker', 'Abilitato', false),
    (NEW.id, 'Eurobet', 'Bookmaker', 'Abilitato', false),
    (NEW.id, 'Betflag', 'Bookmaker', 'Abilitato', false),
    (NEW.id, 'Goldbet', 'Bookmaker', 'Abilitato', false),
    (NEW.id, 'Lottomatica', 'Bookmaker', 'Abilitato', false),
    (NEW.id, 'Better', 'Bookmaker', 'Abilitato', false),
    (NEW.id, 'NetBet', 'Bookmaker', 'Abilitato', false),
    (NEW.id, 'Betsson', 'Bookmaker', 'Abilitato', false),
    (NEW.id, 'Admiral', 'Bookmaker', 'Abilitato', false);
  
  RETURN NEW;
END;
$function$;