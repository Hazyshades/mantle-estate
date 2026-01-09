-- Ensure wallet_address column exists in users table
-- This migration is idempotent and safe to run multiple times
-- It will add the column only if it doesn't exist

DO $$
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'wallet_address'
    ) THEN
        -- Add column if it doesn't exist
        ALTER TABLE users 
        ADD COLUMN wallet_address VARCHAR(42);
        
        RAISE NOTICE 'Added wallet_address column to users table';
    ELSE
        RAISE NOTICE 'wallet_address column already exists';
    END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_wallet_address 
ON users(wallet_address) 
WHERE wallet_address IS NOT NULL;

