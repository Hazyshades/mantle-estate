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
UPDATE cities SET average_property_size_sqft = 1060 WHERE name = 'London' AND country = 'UK';
UPDATE cities SET average_property_size_sqft = 560 WHERE name = 'Paris' AND country = 'France';
UPDATE cities SET average_property_size_sqft = 877 WHERE name = 'Berlin' AND country = 'Germany';
UPDATE cities SET average_property_size_sqft = 1012 WHERE name = 'Dubai' AND country = 'UAE';


-- APAC Set approximate values for APAC cities (based on typical apartment/house sizes in 2025)
UPDATE cities SET average_property_size_sqft = 710 WHERE name = 'Tokyo' AND country = 'Japan';  -- ~66 m²
UPDATE cities SET average_property_size_sqft = 926 WHERE name = 'Singapore' AND country = 'Singapore';  -- ~86 m²
UPDATE cities SET average_property_size_sqft = 484 WHERE name = 'Hong Kong' AND country = 'Hong Kong';  -- ~45 m²
UPDATE cities SET average_property_size_sqft = 969 WHERE name = 'Shanghai' AND country = 'China';  -- ~90 m²
UPDATE cities SET average_property_size_sqft = 2605 WHERE name = 'Sydney' AND country = 'Australia';  -- ~242 m²
UPDATE cities SET average_property_size_sqft = 915 WHERE name = 'Seoul' AND country = 'South Korea';  -- ~85 m²





