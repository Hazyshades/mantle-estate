-- Remove tx_hash column and index from mint_history table
DROP INDEX IF EXISTS idx_mint_history_tx_hash;
ALTER TABLE mint_history DROP COLUMN IF EXISTS tx_hash;

