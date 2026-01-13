DROP TABLE IF EXISTS protocol_fees;
ALTER TABLE transactions DROP COLUMN IF EXISTS protocol_fee;
ALTER TABLE transactions DROP COLUMN IF EXISTS lp_fee;
