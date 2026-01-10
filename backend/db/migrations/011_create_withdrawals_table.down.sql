-- Drop withdrawals table and indexes
DROP INDEX IF EXISTS idx_withdrawals_wallet_address;
DROP INDEX IF EXISTS idx_withdrawals_withdraw_id;
DROP INDEX IF EXISTS idx_withdrawals_tx_hash;
DROP INDEX IF EXISTS idx_withdrawals_user_id;
DROP TABLE IF EXISTS withdrawals;

