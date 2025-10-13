-- Add account_id column to transactions table to link transactions to accounts
ALTER TABLE public.transactions 
ADD COLUMN account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);

-- Add comment to explain the relationship
COMMENT ON COLUMN public.transactions.account_id IS 'Foreign key to accounts table. When an account is deleted, related transactions are automatically deleted.';