-- Migration to safely convert requestsCount from TEXT to INTEGER
BEGIN;

-- Add a new temporary INTEGER column
ALTER TABLE "accounts" ADD COLUMN "requestsCount_int" INTEGER;

-- Convert existing values with proper handling for NULL and empty strings
UPDATE "accounts" SET "requestsCount_int" = 
  CASE 
    WHEN "requestsCount" IS NULL OR "requestsCount" = '' THEN 0
    ELSE CAST("requestsCount" AS INTEGER) 
  END;

-- Drop the original TEXT column
ALTER TABLE "accounts" DROP COLUMN "requestsCount";

-- Rename the INT column to the original name
ALTER TABLE "accounts" RENAME COLUMN "requestsCount_int" TO "requestsCount";

-- Set the default value
ALTER TABLE "accounts" ALTER COLUMN "requestsCount" SET DEFAULT 0;

COMMIT;
