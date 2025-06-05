-- Migration: Make accountId nullable in subscriptions table
-- This allows subscriptions for users who don't have accounts records (credentials users)

BEGIN;

-- Remove the NOT NULL constraint from accountId
ALTER TABLE subscriptions ALTER COLUMN "accountId" DROP NOT NULL;

-- Add a comment to document this change
COMMENT ON COLUMN subscriptions."accountId" IS 'References accounts.id - nullable to support credentials-based users who do not have account records';

COMMIT;
