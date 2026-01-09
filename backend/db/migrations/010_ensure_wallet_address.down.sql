-- Remove wallet_address column from users table
DROP INDEX IF EXISTS idx_users_wallet_address;
ALTER TABLE users 
DROP COLUMN IF EXISTS wallet_address;

