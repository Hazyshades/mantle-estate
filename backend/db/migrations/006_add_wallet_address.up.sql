-- Add wallet_address column to users table for MetaMask addresses
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Create index for wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

