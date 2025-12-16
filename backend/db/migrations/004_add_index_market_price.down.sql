-- 
ALTER TABLE price_history DROP COLUMN IF EXISTS index_price_usd;
ALTER TABLE price_history DROP COLUMN IF EXISTS market_price_usd;
DROP TABLE IF EXISTS market_price_history;
ALTER TABLE cities DROP COLUMN IF EXISTS last_funding_update;
ALTER TABLE cities DROP COLUMN IF EXISTS funding_rate;
ALTER TABLE cities DROP COLUMN IF EXISTS index_price_usd;
ALTER TABLE cities DROP COLUMN IF EXISTS market_price_usd;
