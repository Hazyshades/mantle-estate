-- Remove last_market_price_update column from cities table
ALTER TABLE cities 
DROP COLUMN IF EXISTS last_market_price_update;
