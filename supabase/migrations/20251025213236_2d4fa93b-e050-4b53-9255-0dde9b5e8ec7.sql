-- ============================================
-- FIX: Sposta estensioni supportate da public schema
-- ============================================

-- Nota: Alcune estensioni Supabase (pg_net, pgsodium, vault, etc.) 
-- non supportano SET SCHEMA o sono gestite internamente.
-- Queste devono rimanere nel public schema.

DO $$
DECLARE
  ext_name text;
  ext_list text[] := ARRAY[
    'pgcrypto',
    'uuid-ossp',
    'pg_stat_statements'
  ];
BEGIN
  -- Crea schema extensions se non esiste
  CREATE SCHEMA IF NOT EXISTS extensions;
  
  -- Sposta solo le estensioni che supportano SET SCHEMA
  FOREACH ext_name IN ARRAY ext_list
  LOOP
    IF EXISTS (
      SELECT 1 
      FROM pg_extension e
      JOIN pg_namespace n ON e.extnamespace = n.oid
      WHERE e.extname = ext_name 
      AND n.nspname = 'public'
    ) THEN
      BEGIN
        EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', ext_name);
        RAISE NOTICE 'Moved extension % to extensions schema', ext_name;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Cannot move extension % (not supported): %', ext_name, SQLERRM;
      END;
    END IF;
  END LOOP;
END $$;

-- Commento finale
COMMENT ON SCHEMA extensions IS 'Estensioni PostgreSQL spostate da public schema. Nota: alcune estensioni Supabase rimangono in public per requisiti di sistema.';