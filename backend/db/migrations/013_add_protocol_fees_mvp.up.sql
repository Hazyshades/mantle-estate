-- Add fields for protocol fees (20% of all fees)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS protocol_fee DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS lp_fee DOUBLE PRECISION DEFAULT 0.0;

-- Create table for accumulating protocol fees
CREATE TABLE IF NOT EXISTS protocol_fees (
  id BIGSERIAL PRIMARY KEY,
  total_collected DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Initialize protocol fees record
INSERT INTO protocol_fees (total_collected) VALUES (0.0) ON CONFLICT DO NOTHING;
