-- Create deposits table for tracking blockchain deposits
CREATE TABLE IF NOT EXISTS deposits (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    deposit_id BIGINT NOT NULL UNIQUE,  -- depositId from contract event
    tx_hash VARCHAR(66) NOT NULL UNIQUE,
    wallet_address VARCHAR(42) NOT NULL,
    amount BIGINT NOT NULL,  -- in smallest units (6 decimals for USDC)
    block_number BIGINT NOT NULL,
    timestamp BIGINT NOT NULL,
    nonce BIGINT NOT NULL,
    processed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance (only create if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_deposits_user_id') THEN
        CREATE INDEX idx_deposits_user_id ON deposits(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_deposits_tx_hash') THEN
        CREATE INDEX idx_deposits_tx_hash ON deposits(tx_hash);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_deposits_deposit_id') THEN
        CREATE INDEX idx_deposits_deposit_id ON deposits(deposit_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_deposits_wallet_address') THEN
        CREATE INDEX idx_deposits_wallet_address ON deposits(wallet_address);
    END IF;
END $$;

