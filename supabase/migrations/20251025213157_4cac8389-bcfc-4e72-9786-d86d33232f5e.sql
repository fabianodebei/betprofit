-- ============================================
-- FIX: Sposta estensioni da public schema (con gestione errori)
-- ============================================

DO $$
DECLARE
  ext_name text;
  ext_list text[] := ARRAY[
    'pg_stat_statements',
    'pgcrypto',
    'uuid-ossp',
    'pgjwt'
  ];
BEGIN
  -- Crea schema extensions se non esiste
  CREATE SCHEMA IF NOT EXISTS extensions;
  
  -- Sposta ogni estensione se presente nel public schema
  FOREACH ext_name IN ARRAY ext_list
  LOOP
    BEGIN
      IF EXISTS (
        SELECT 1 
        FROM pg_extension e
        JOIN pg_namespace n ON e.extnamespace = n.oid
        WHERE e.extname = ext_name 
        AND n.nspname = 'public'
      ) THEN
        EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', ext_name);
        RAISE NOTICE 'Moved extension % to extensions schema', ext_name;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Cannot move extension % (system extension): %', ext_name, SQLERRM;
    END;
  END LOOP;
  
  -- Nota: Alcune estensioni di sistema Supabase (pg_net, pgsodium, pg_graphql, ecc.)
  -- non possono essere spostate e devono rimanere nel public schema.
  -- Questo è normale e sicuro perché sono gestite da Supabase.
END $$;