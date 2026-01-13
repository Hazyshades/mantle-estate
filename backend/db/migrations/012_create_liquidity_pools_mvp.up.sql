-- Liquidity pools table (one pool per city)
CREATE TABLE liquidity_pools (
  id BIGSERIAL PRIMARY KEY,
  city_id BIGINT NOT NULL UNIQUE REFERENCES cities(id),
  total_liquidity DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  total_shares DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  cumulative_pnl DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  total_fees_collected DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- LP provider positions table
CREATE TABLE lp_positions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  pool_id BIGINT NOT NULL REFERENCES liquidity_pools(id),
  shares DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  deposited_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  withdrawn_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, pool_id)
);

-- LP transactions history table (simplified)
CREATE TABLE lp_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  pool_id BIGINT NOT NULL REFERENCES liquidity_pools(id),
  transaction_type TEXT NOT NULL, -- 'deposit', 'withdraw'
  amount DOUBLE PRECISION,
  shares DOUBLE PRECISION,
  price_per_share DOUBLE PRECISION,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_type CHECK (transaction_type IN ('deposit', 'withdraw'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lp_positions_user_id ON lp_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_lp_positions_pool_id ON lp_positions(pool_id);
CREATE INDEX IF NOT EXISTS idx_lp_transactions_user_id ON lp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_lp_transactions_pool_id ON lp_transactions(pool_id);
CREATE INDEX IF NOT EXISTS idx_lp_transactions_timestamp ON lp_transactions(timestamp DESC);
