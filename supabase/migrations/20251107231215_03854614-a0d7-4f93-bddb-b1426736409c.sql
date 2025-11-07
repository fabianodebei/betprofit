-- Allow Riconciliazione in transactions.metodo
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_metodo_check;

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_metodo_check
CHECK (metodo IN ('Deposito','Spesa','Prelievo','Riconciliazione'));
