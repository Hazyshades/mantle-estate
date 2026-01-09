-- Add wallet_address column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42);

-- Create index for wallet address lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address) WHERE wallet_address IS NOT NULL;
