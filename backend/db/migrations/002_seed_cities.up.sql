-- Insert initial cities with their starting prices (only if they don't exist)
-- Check if index_price_usd column exists to determine which columns to insert
DO $$
BEGIN
  -- Try to insert with all columns (if migration 004 was applied)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'cities' AND column_name = 'index_price_usd') THEN
    INSERT INTO cities (name, country, current_price_usd, index_price_usd, market_price_usd, funding_rate)
    SELECT * FROM (VALUES
      ('New York, NY', 'USA', 699394.63, 699394.63, 699394.63, 0.0),
      ('Miami, FL', 'USA', 467083.41, 467083.41, 467083.41, 0.0),
      ('Los Angeles, CA', 'USA', 932886.24, 932886.24, 932886.24, 0.0),
      ('Chicago, IL', 'USA', 334511.79, 334511.79, 334511.79, 0.0),
      ('Dallas, TX', 'USA', 359523.20, 359523.20, 359523.20, 0.0),
      ('Houston, TX', 'USA', 303674.54, 303674.54, 303674.54, 0.0),
      ('Washington, DC', 'USA', 567339.74, 567339.74, 567339.74, 0.0),
      ('Philadelphia, PA', 'USA', 375500.89, 375500.89, 375500.89, 0.0),
      ('London', 'UK', 11000.00, 11000.00, 11000.00, 0.0),
      ('Paris', 'France', 9500.00, 9500.00, 9500.00, 0.0),
      ('Tokyo', 'Japan', 699913.14, 699913.14, 699913.14, 0.0),
      ('Singapore', 'Singapore', 1209533.18, 1209533.18, 1209533.18, 0.0),
      ('Berlin', 'Germany', 7000.00, 7000.00, 7000.00, 0.0),
      ('Dubai', 'UAE', 5500.00, 5500.00, 5500.00, 0.0),
      ('Hong Kong', 'Hong Kong', 1112948.42, 1112948.42, 1112948.42, 0.0),
      ('Shanghai', 'China', 694201.56, 694201.56, 694201.56, 0.0),
      ('Sydney', 'Australia', 990457.34, 990457.34, 990457.34, 0.0),
      ('Seoul', 'South Korea', 824345.17, 824345.17, 824345.17, 0.0)
    ) AS v(name, country, current_price_usd, index_price_usd, market_price_usd, funding_rate)
    WHERE NOT EXISTS (
      SELECT 1 FROM cities c 
      WHERE c.name = v.name AND c.country = v.country
    );
  ELSE
    -- Insert with only current_price_usd (if migration 004 was not applied yet)
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
  END IF;
END $$;

-- Update existing cities with latest prices from CSV data
-- Update USA cities (update all price fields if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'cities' AND column_name = 'index_price_usd') THEN
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
      ELSE current_price_usd
    END,
    index_price_usd = CASE 
      WHEN name = 'New York, NY' AND country = 'USA' THEN 699394.63
      WHEN name = 'Miami, FL' AND country = 'USA' THEN 467083.41
      WHEN name = 'Los Angeles, CA' AND country = 'USA' THEN 932886.24
      WHEN name = 'Chicago, IL' AND country = 'USA' THEN 334511.79
      WHEN name = 'Dallas, TX' AND country = 'USA' THEN 359523.20
      WHEN name = 'Houston, TX' AND country = 'USA' THEN 303674.54
      WHEN name = 'Washington, DC' AND country = 'USA' THEN 567339.74
      WHEN name = 'Philadelphia, PA' AND country = 'USA' THEN 375500.89
      ELSE index_price_usd
    END,
    market_price_usd = CASE 
      WHEN name = 'New York, NY' AND country = 'USA' THEN 699394.63
      WHEN name = 'Miami, FL' AND country = 'USA' THEN 467083.41
      WHEN name = 'Los Angeles, CA' AND country = 'USA' THEN 932886.24
      WHEN name = 'Chicago, IL' AND country = 'USA' THEN 334511.79
      WHEN name = 'Dallas, TX' AND country = 'USA' THEN 359523.20
      WHEN name = 'Houston, TX' AND country = 'USA' THEN 303674.54
      WHEN name = 'Washington, DC' AND country = 'USA' THEN 567339.74
      WHEN name = 'Philadelphia, PA' AND country = 'USA' THEN 375500.89
      ELSE market_price_usd
    END,
    last_updated = NOW()
    WHERE (name = 'New York, NY' AND country = 'USA')
       OR (name = 'Miami, FL' AND country = 'USA')
       OR (name = 'Los Angeles, CA' AND country = 'USA')
       OR (name = 'Chicago, IL' AND country = 'USA')
       OR (name = 'Dallas, TX' AND country = 'USA')
       OR (name = 'Houston, TX' AND country = 'USA')
       OR (name = 'Washington, DC' AND country = 'USA')
       OR (name = 'Philadelphia, PA' AND country = 'USA');
  ELSE
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
       OR (name = 'Philadelphia, PA' AND country = 'USA');
  END IF;
END $$;

-- Update APAC cities (update all price fields if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'cities' AND column_name = 'index_price_usd') THEN
    UPDATE cities 
    SET current_price_usd = CASE 
      WHEN name = 'Tokyo' AND country = 'Japan' THEN 699913.14
      WHEN name = 'Singapore' AND country = 'Singapore' THEN 1209533.18
      WHEN name = 'Hong Kong' AND country = 'Hong Kong' THEN 1112948.42
      WHEN name = 'Shanghai' AND country = 'China' THEN 694201.56
      WHEN name = 'Sydney' AND country = 'Australia' THEN 990457.34
      WHEN name = 'Seoul' AND country = 'South Korea' THEN 824345.17
      ELSE current_price_usd
    END,
    index_price_usd = CASE 
      WHEN name = 'Tokyo' AND country = 'Japan' THEN 699913.14
      WHEN name = 'Singapore' AND country = 'Singapore' THEN 1209533.18
      WHEN name = 'Hong Kong' AND country = 'Hong Kong' THEN 1112948.42
      WHEN name = 'Shanghai' AND country = 'China' THEN 694201.56
      WHEN name = 'Sydney' AND country = 'Australia' THEN 990457.34
      WHEN name = 'Seoul' AND country = 'South Korea' THEN 824345.17
      ELSE index_price_usd
    END,
    market_price_usd = CASE 
      WHEN name = 'Tokyo' AND country = 'Japan' THEN 699913.14
      WHEN name = 'Singapore' AND country = 'Singapore' THEN 1209533.18
      WHEN name = 'Hong Kong' AND country = 'Hong Kong' THEN 1112948.42
      WHEN name = 'Shanghai' AND country = 'China' THEN 694201.56
      WHEN name = 'Sydney' AND country = 'Australia' THEN 990457.34
      WHEN name = 'Seoul' AND country = 'South Korea' THEN 824345.17
      ELSE market_price_usd
    END,
    last_updated = NOW()
    WHERE (name = 'Tokyo' AND country = 'Japan')
       OR (name = 'Singapore' AND country = 'Singapore')
       OR (name = 'Hong Kong' AND country = 'Hong Kong')
       OR (name = 'Shanghai' AND country = 'China')
       OR (name = 'Sydney' AND country = 'Australia')
       OR (name = 'Seoul' AND country = 'South Korea');
  ELSE
    UPDATE cities 
    SET current_price_usd = CASE 
      WHEN name = 'Tokyo' AND country = 'Japan' THEN 699913.14
      WHEN name = 'Singapore' AND country = 'Singapore' THEN 1209533.18
      WHEN name = 'Hong Kong' AND country = 'Hong Kong' THEN 1112948.42
      WHEN name = 'Shanghai' AND country = 'China' THEN 694201.56
      WHEN name = 'Sydney' AND country = 'Australia' THEN 990457.34
      WHEN name = 'Seoul' AND country = 'South Korea' THEN 824345.17
      ELSE current_price_usd
    END,
    last_updated = NOW()
    WHERE (name = 'Tokyo' AND country = 'Japan')
       OR (name = 'Singapore' AND country = 'Singapore')
       OR (name = 'Hong Kong' AND country = 'Hong Kong')
       OR (name = 'Shanghai' AND country = 'China')
       OR (name = 'Sydney' AND country = 'Australia')
       OR (name = 'Seoul' AND country = 'South Korea');
  END IF;
END $$;

-- Insert initial price history for all cities (only if history doesn't exist)
INSERT INTO price_history (city_id, price_usd, timestamp)
SELECT c.id, c.current_price_usd, NOW()
FROM cities c
WHERE NOT EXISTS (
  SELECT 1 FROM price_history ph 
  WHERE ph.city_id = c.id
);
