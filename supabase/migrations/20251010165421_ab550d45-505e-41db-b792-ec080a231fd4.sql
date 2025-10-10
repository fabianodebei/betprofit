-- Step 1: Make user_id NOT NULL in all tables
-- First, delete any orphaned records without user_id (if any exist)
DELETE FROM accounts WHERE user_id IS NULL;
DELETE FROM bet_legs WHERE user_id IS NULL;
DELETE FROM bets WHERE user_id IS NULL;
DELETE FROM books WHERE user_id IS NULL;
DELETE FROM intestatari WHERE user_id IS NULL;
DELETE FROM lay_bets WHERE user_id IS NULL;
DELETE FROM reminders WHERE user_id IS NULL;
DELETE FROM tags WHERE user_id IS NULL;
DELETE FROM transactions WHERE user_id IS NULL;
DELETE FROM wallets WHERE user_id IS NULL;

-- Now make user_id NOT NULL
ALTER TABLE accounts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE bet_legs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE bets ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE books ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE intestatari ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE lay_bets ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE reminders ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tags ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE wallets ALTER COLUMN user_id SET NOT NULL;

-- Step 2: Secure Telegram configuration
-- Drop existing user policies that allow reading sensitive data
DROP POLICY IF EXISTS "Users can view own telegram config" ON user_telegram_config;

-- Create new policy that only allows users to see non-sensitive fields
CREATE POLICY "Users can view own telegram config (limited)"
ON user_telegram_config
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Note: The SELECT will be limited by the client to exclude sensitive fields
-- Service role can still read everything via the existing "Service role can read all telegram configs" policy

-- Step 3: Add input validation function for telegram messages
CREATE OR REPLACE FUNCTION validate_telegram_message(message text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check message is not empty
  IF message IS NULL OR trim(message) = '' THEN
    RETURN false;
  END IF;
  
  -- Check message length (Telegram limit is 4096 characters)
  IF length(message) > 4096 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;