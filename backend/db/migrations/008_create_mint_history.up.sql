-- Mint history table to track daily mint limits
-- Note: If migration fails due to ownership issues, manually run:
--   DROP TABLE IF EXISTS mint_history CASCADE;
-- Then restart the migration

-- Create table if not exists
CREATE TABLE IF NOT EXISTS mint_history (
  id BIGSERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  amount BIGINT NOT NULL, -- amount in smallest units (6 decimals)
  minted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for daily limit queries (create if not exists)
CREATE INDEX IF NOT EXISTS idx_mint_history_wallet_date ON mint_history(wallet_address, DATE(minted_at));
CREATE INDEX IF NOT EXISTS idx_mint_history_minted_at ON mint_history(minted_at DESC);

