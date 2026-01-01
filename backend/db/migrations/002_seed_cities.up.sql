-- Insert initial cities with their starting prices (only if they don't exist)
INSERT INTO cities (name, country, current_price_usd)
SELECT * FROM (VALUES
  ('New York, NY', 'USA', 699394.63),
  ('Miami, FL', 'USA', 467083.41),
  ('Los Angeles, CA', 'USA', 932886.24),
  ('Chicago, IL', 'USA', 334511.79),
  ('Dallas, TX', 'USA', 359523.20),
  ('Houston, TX', 'USA', 303674.54),
  ('Washington, DC', 'USA', 567339.74),
  ('Philadelphia, PA', 'USA', 375500.89),
  ('London', 'UK', 11000.00),
  ('Paris', 'France', 9500.00),
  ('Tokyo', 'Japan', 699913.14),
  ('Singapore', 'Singapore', 1209533.18),
  ('Berlin', 'Germany', 7000.00),
  ('Dubai', 'UAE', 5500.00),
  ('Hong Kong', 'Hong Kong', 1112948.42),
  ('Shanghai', 'China', 694201.56),
  ('Sydney', 'Australia', 990457.34),
  ('Seoul', 'South Korea', 824345.17)
) AS v(name, country, current_price_usd)
WHERE NOT EXISTS (
  SELECT 1 FROM cities c 
  WHERE c.name = v.name AND c.country = v.country
);

-- Update existing cities with latest prices from CSV data
UPDATE cities 
SET current_price_usd = CASE 
  WHEN name = 'New York, NY' AND country = 'USA' THEN 699394.63
  WHEN name = 'Miami, FL' AND country = 'USA' THEN 467083.41
  WHEN name = 'Los Angeles, CA' AND country = 'USA' THEN 932886.24
  WHEN name = 'Chicago, IL' AND country = 'USA' THEN 334511.79
  WHEN name = 'Dallas, TX' AND country = 'USA' THEN 359523.20
  WHEN name = 'Houston, TX' AND country = 'USA' THEN 303674.54
  WHEN name = 'Washington, DC' AND country = 'USA' THEN 567339.74
  WHEN name = 'Philadelphia, PA' AND country = 'USA' THEN 375500.89
  WHEN name = 'Tokyo' AND country = 'Japan' THEN 699913.14
  WHEN name = 'Singapore' AND country = 'Singapore' THEN 1209533.18
  ELSE current_price_usd
END,
last_updated = NOW()
WHERE (name = 'New York, NY' AND country = 'USA')
   OR (name = 'Miami, FL' AND country = 'USA')
   OR (name = 'Los Angeles, CA' AND country = 'USA')
   OR (name = 'Chicago, IL' AND country = 'USA')
   OR (name = 'Dallas, TX' AND country = 'USA')
   OR (name = 'Houston, TX' AND country = 'USA')
   OR (name = 'Washington, DC' AND country = 'USA')
   OR (name = 'Philadelphia, PA' AND country = 'USA')
   OR (name = 'Tokyo' AND country = 'Japan')
   OR (name = 'Singapore' AND country = 'Singapore');

-- Insert initial price history for all cities (only if history doesn't exist)
INSERT INTO price_history (city_id, price_usd, timestamp)
SELECT c.id, c.current_price_usd, NOW()
FROM cities c
WHERE NOT EXISTS (
  SELECT 1 FROM price_history ph 
  WHERE ph.city_id = c.id
);
