-- Add last_market_price_update timestamp column to cities table
ALTER TABLE cities 
ADD COLUMN IF NOT EXISTS last_market_price_update TIMESTAMP;

-- Set default value for existing records to NOW()
UPDATE cities 
SET last_market_price_update = NOW()
WHERE last_market_price_update IS NULL;

