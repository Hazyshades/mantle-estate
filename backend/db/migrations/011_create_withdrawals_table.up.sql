-- Create withdrawals table for tracking blockchain withdrawals
CREATE TABLE IF NOT EXISTS withdrawals (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    withdraw_id BIGINT NOT NULL UNIQUE,  -- withdrawId from contract event
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
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_withdrawals_user_id') THEN
        CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_withdrawals_tx_hash') THEN
        CREATE INDEX idx_withdrawals_tx_hash ON withdrawals(tx_hash);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_withdrawals_withdraw_id') THEN
        CREATE INDEX idx_withdrawals_withdraw_id ON withdrawals(withdraw_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_withdrawals_wallet_address') THEN
        CREATE INDEX idx_withdrawals_wallet_address ON withdrawals(wallet_address);
    END IF;
END $$;

