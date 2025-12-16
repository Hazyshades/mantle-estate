-- Insert initial cities with their starting prices
INSERT INTO cities (name, country, current_price_usd) VALUES
  ('New York', 'USA', 12000),
  ('Miami', 'USA', 6500),
  ('London', 'UK', 11000),
  ('Paris', 'France', 9500),
  ('Tokyo', 'Japan', 8000),
  ('Singapore', 'Singapore', 13000),
  ('Berlin', 'Germany', 7000),
  ('Dubai', 'UAE', 5500);

-- Insert initial price history for all cities
INSERT INTO price_history (city_id, price_usd)
SELECT id, current_price_usd
FROM cities;
