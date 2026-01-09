-- Drop deposits table and indexes
DROP INDEX IF EXISTS idx_deposits_wallet_address;
DROP INDEX IF EXISTS idx_deposits_deposit_id;
DROP INDEX IF EXISTS idx_deposits_tx_hash;
DROP INDEX IF EXISTS idx_deposits_user_id;
DROP TABLE IF EXISTS deposits;

