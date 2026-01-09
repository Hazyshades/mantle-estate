-- Add tx_hash column to mint_history table to track on-chain transactions
ALTER TABLE mint_history 
ADD COLUMN IF NOT EXISTS tx_hash VARCHAR(66);

-- Create index for tx_hash lookups
CREATE INDEX IF NOT EXISTS idx_mint_history_tx_hash ON mint_history(tx_hash);

