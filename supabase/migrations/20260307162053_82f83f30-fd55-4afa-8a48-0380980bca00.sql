-- Fix intestatari uniqueness scope: allow same name across different users
-- while keeping uniqueness per user.
ALTER TABLE public.intestatari
DROP CONSTRAINT IF EXISTS intestatari_nome_key;

ALTER TABLE public.intestatari
ADD CONSTRAINT intestatari_user_id_nome_key UNIQUE (user_id, nome);