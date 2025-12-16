-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT,
  balance DOUBLE PRECISION NOT NULL DEFAULT 100.0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Cities table
CREATE TABLE cities (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  current_price_usd DOUBLE PRECISION NOT NULL,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Positions table
CREATE TABLE positions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  city_id BIGINT NOT NULL REFERENCES cities(id),
  position_type TEXT NOT NULL,
  quantity_sqm DOUBLE PRECISION NOT NULL,
  entry_price DOUBLE PRECISION NOT NULL,
  leverage INTEGER NOT NULL DEFAULT 1,
  margin_required DOUBLE PRECISION NOT NULL,
  opening_fee DOUBLE PRECISION NOT NULL,
  opened_at TIMESTAMP NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMP,
  exit_price DOUBLE PRECISION,
  closing_fee DOUBLE PRECISION,
  pnl DOUBLE PRECISION
);

-- Transactions table
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  transaction_type TEXT NOT NULL,
  city_id BIGINT NOT NULL REFERENCES cities(id),
  quantity DOUBLE PRECISION NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  fee DOUBLE PRECISION NOT NULL,
  pnl DOUBLE PRECISION,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Price history table
CREATE TABLE price_history (
  id BIGSERIAL PRIMARY KEY,
  city_id BIGINT NOT NULL REFERENCES cities(id),
  price_usd DOUBLE PRECISION NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_positions_user_id ON positions(user_id);
CREATE INDEX idx_positions_city_id ON positions(city_id);
CREATE INDEX idx_positions_closed_at ON positions(closed_at);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX idx_price_history_city_id ON price_history(city_id);
CREATE INDEX idx_price_history_timestamp ON price_history(timestamp DESC);
