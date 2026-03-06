

## Problema

La funzione `admin_get_all_users` restituisce solo i dati dalla tabella `auth.users`, senza fare join con `user_roles`:

```sql
RETURN (SELECT json_agg(row_to_json(u)) FROM auth.users u);
```

Quindi il campo `role` non esiste nei dati restituiti, e tutti gli utenti vengono mostrati come "Gratuito" (il fallback del frontend).

## Soluzione

Aggiornare la funzione SQL `admin_get_all_users` per includere il ruolo dalla tabella `user_roles`:

```sql
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT 
        u.id,
        u.email,
        u.raw_user_meta_data->>'full_name' as full_name,
        u.created_at,
        COALESCE(ur.role, 'free') as role
      FROM auth.users u
      LEFT JOIN public.user_roles ur ON u.id = ur.user_id
      ORDER BY u.created_at DESC
    ) t
  );
END;
$$;
```

### Modifiche

1. **Migration SQL**: Aggiornare `admin_get_all_users` con LEFT JOIN su `user_roles` e aggiungere il check admin mancante
2. **Nessuna modifica frontend**: Il codice TypeScript già gestisce il campo `role` correttamente

### Note di sicurezza
La funzione attuale non verifica nemmeno che il chiamante sia admin (a differenza delle altre funzioni admin). La nuova versione aggiunge anche quel controllo.

