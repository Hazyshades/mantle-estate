-- Add fields for Index Price and Market Price to cities table
ALTER TABLE cities 
ADD COLUMN IF NOT EXISTS index_price_usd DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS market_price_usd DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS funding_rate DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS last_funding_update TIMESTAMP DEFAULT NOW();

-- Update existing records: market_price = current_price_usd, index_price = current_price_usd
UPDATE cities 
SET market_price_usd = current_price_usd,
    index_price_usd = current_price_usd
WHERE market_price_usd IS NULL;

-- Make fields required after filling
ALTER TABLE cities 
ALTER COLUMN index_price_usd SET NOT NULL,
ALTER COLUMN market_price_usd SET NOT NULL;

-- Add table for Market Price history (separate from Index Price)
CREATE TABLE IF NOT EXISTS market_price_history (
  id BIGSERIAL PRIMARY KEY,
  city_id BIGINT NOT NULL REFERENCES cities(id),
  market_price_usd DOUBLE PRECISION NOT NULL,
  index_price_usd DOUBLE PRECISION NOT NULL,
  funding_rate DOUBLE PRECISION NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_market_price_history_city_id ON market_price_history(city_id);
CREATE INDEX IF NOT EXISTS idx_market_price_history_timestamp ON market_price_history(timestamp DESC);

-- Update price_history table to store both prices
ALTER TABLE price_history 
ADD COLUMN IF NOT EXISTS market_price_usd DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS index_price_usd DOUBLE PRECISION;

-- Fill historical data
UPDATE price_history ph
SET market_price_usd = ph.price_usd,
    index_price_usd = ph.price_usd
WHERE market_price_usd IS NULL;
