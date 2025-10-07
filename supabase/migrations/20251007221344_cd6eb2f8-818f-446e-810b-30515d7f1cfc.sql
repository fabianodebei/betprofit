-- Add wallet_id column to accounts table to link accounts with wallets
ALTER TABLE public.accounts 
ADD COLUMN wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL;

-- Add index for better performance on wallet_id lookups
CREATE INDEX idx_accounts_wallet_id ON public.accounts(wallet_id);

-- Add a comment to explain the relationship
COMMENT ON COLUMN public.accounts.wallet_id IS 'References the wallet associated with this bookmaker account. Account balance is linked to wallet balance.';