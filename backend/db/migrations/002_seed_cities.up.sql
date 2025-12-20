-- Insert initial cities with their starting prices (only if they don't exist)
INSERT INTO cities (name, country, current_price_usd)
SELECT * FROM (VALUES
  ('New York, NY', 'USA', 12000),
  ('Miami, FL', 'USA', 6500),
  ('Los Angeles, CA', 'USA', 8500),
  ('Chicago, IL', 'USA', 3500),
  ('Dallas, TX', 'USA', 2200),
  ('Houston, TX', 'USA', 1800),
  ('Washington, DC', 'USA', 5500),
  ('Philadelphia, PA', 'USA', 2300),
  ('London', 'UK', 11000),
  ('Paris', 'France', 9500),
  ('Tokyo', 'Japan', 8000),
  ('Singapore', 'Singapore', 13000),
  ('Berlin', 'Germany', 7000),
  ('Dubai', 'UAE', 5500)
) AS v(name, country, current_price_usd)
WHERE NOT EXISTS (
  SELECT 1 FROM cities c 
  WHERE c.name = v.name AND c.country = v.country
);

-- Insert initial price history for all cities (only if history doesn't exist)
INSERT INTO price_history (city_id, price_usd, timestamp)
SELECT c.id, c.current_price_usd, NOW()
FROM cities c
WHERE NOT EXISTS (
  SELECT 1 FROM price_history ph 
  WHERE ph.city_id = c.id
);
