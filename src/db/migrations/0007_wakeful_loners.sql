ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Convert requestsCount from TEXT to INTEGER with explicit USING clause
ALTER TABLE "accounts" ALTER COLUMN "requestsCount" TYPE INTEGER USING "requestsCount"::INTEGER;
ALTER TABLE "accounts" ALTER COLUMN "requestsCount" SET DEFAULT 0;

