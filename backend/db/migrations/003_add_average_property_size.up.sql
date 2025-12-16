-- Add average_property_size_sqft column to cities table
ALTER TABLE cities 
ADD COLUMN IF NOT EXISTS average_property_size_sqft DOUBLE PRECISION;

-- Update existing cities with average property size data
UPDATE cities SET average_property_size_sqft = 1464 WHERE name = 'New York, NY';
UPDATE cities SET average_property_size_sqft = 1332 WHERE name = 'Miami, FL';
UPDATE cities SET average_property_size_sqft = 1707 WHERE name = 'Los Angeles, CA';
UPDATE cities SET average_property_size_sqft = 1700 WHERE name = 'Chicago, IL';
UPDATE cities SET average_property_size_sqft = 2154 WHERE name = 'Dallas, TX';
UPDATE cities SET average_property_size_sqft = 2094 WHERE name = 'Houston, TX';
UPDATE cities SET average_property_size_sqft = 1872 WHERE name = 'Washington, DC';
UPDATE cities SET average_property_size_sqft = 1586 WHERE name = 'Philadelphia, PA';

-- Set approximate values for international cities (based on typical apartment sizes)
UPDATE cities SET average_property_size_sqft = 800 WHERE name = 'London' AND country = 'UK';
UPDATE cities SET average_property_size_sqft = 900 WHERE name = 'Paris' AND country = 'France';
UPDATE cities SET average_property_size_sqft = 1000 WHERE name = 'Tokyo' AND country = 'Japan';
UPDATE cities SET average_property_size_sqft = 1100 WHERE name = 'Singapore' AND country = 'Singapore';
UPDATE cities SET average_property_size_sqft = 1200 WHERE name = 'Berlin' AND country = 'Germany';
UPDATE cities SET average_property_size_sqft = 1500 WHERE name = 'Dubai' AND country = 'UAE';
