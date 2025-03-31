-- Fixed merged migration from 0004, 0005, and 0006

-- First, add columns to User table (without timezone changes yet)
ALTER TABLE "User" ADD COLUMN "updated_at" timestamp DEFAULT now();
ALTER TABLE "User" ADD COLUMN "password_updated_at" timestamp;

-- Then rename enum type
ALTER TYPE "public"."AppBetaOptInStatus" RENAME TO "appBetaOptInStatus";

-- First drop all constraints to avoid dependency errors
ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_api_key_unique";
ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_sessionToken_unique";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_email_unique";
ALTER TABLE "webhook_results" DROP CONSTRAINT IF EXISTS "webhook_results_prediction_id_unique";
ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_userId_User_id_fk";
ALTER TABLE "BankAccount" DROP CONSTRAINT IF EXISTS "BankAccount_userId_User_id_fk";
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_userId_User_id_fk";
ALTER TABLE "CategoryExpense" DROP CONSTRAINT IF EXISTS "CategoryExpense_monthlyAggregateId_MonthlyAggregate_id_fk";
ALTER TABLE "CategoryExpense" DROP CONSTRAINT IF EXISTS "CategoryExpense_categoryId_Category_id_fk";
ALTER TABLE "ClassificationJob" DROP CONSTRAINT IF EXISTS "ClassificationJob_userId_User_id_fk";
ALTER TABLE "embeddings" DROP CONSTRAINT IF EXISTS "embeddings_accountId_Account_id_fk";
ALTER TABLE "MonthlyAggregate" DROP CONSTRAINT IF EXISTS "MonthlyAggregate_userId_User_id_fk";
ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_User_id_fk";
ALTER TABLE "TrainingJob" DROP CONSTRAINT IF EXISTS "TrainingJob_userId_User_id_fk";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_bankAccountId_BankAccount_id_fk";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_categoryId_Category_id_fk";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_userId_User_id_fk";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_classificationJobId_ClassificationJob_id_fk";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_trainingJobId_TrainingJob_id_fk";
ALTER TABLE "VerificationToken" DROP CONSTRAINT IF EXISTS "VerificationToken_identifier_token_pk";

-- Now rename all tables (no references to these tables yet)
ALTER TABLE "Account" RENAME TO "accounts";
ALTER TABLE "BankAccount" RENAME TO "bankAccounts";
ALTER TABLE "Category" RENAME TO "categories";
ALTER TABLE "CategoryExpense" RENAME TO "categoryExpenses";
ALTER TABLE "ClassificationJob" RENAME TO "classificationJobs";
ALTER TABLE "MonthlyAggregate" RENAME TO "monthlyAggregates";
ALTER TABLE "Session" RENAME TO "sessions";
ALTER TABLE "TrainingJob" RENAME TO "trainingJobs";
ALTER TABLE "Transaction" RENAME TO "transactions";
ALTER TABLE "User" RENAME TO "users";
ALTER TABLE "VerificationToken" RENAME TO "verificationTokens";
ALTER TABLE "webhook_results" RENAME TO "webhookResults";

-- Change data types on columns with explicit USING clause - commenting out problematic conversion
-- ALTER TABLE "accounts" ALTER COLUMN "requestsCount" SET DEFAULT 0;

-- Add back constraints with the new table names
ALTER TABLE "verificationTokens" ADD CONSTRAINT "verificationTokens_identifier_token_pk" PRIMARY KEY("identifier","token");
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "bankAccounts" ADD CONSTRAINT "bankAccounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "categories" ADD CONSTRAINT "categories_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "categoryExpenses" ADD CONSTRAINT "categoryExpenses_monthlyAggregateId_monthlyAggregates_id_fk" FOREIGN KEY ("monthlyAggregateId") REFERENCES "public"."monthlyAggregates"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "categoryExpenses" ADD CONSTRAINT "categoryExpenses_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "classificationJobs" ADD CONSTRAINT "classificationJobs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_accountId_accounts_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "monthlyAggregates" ADD CONSTRAINT "monthlyAggregates_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "trainingJobs" ADD CONSTRAINT "trainingJobs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bankAccountId_bankAccounts_id_fk" FOREIGN KEY ("bankAccountId") REFERENCES "public"."bankAccounts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_classificationJobId_classificationJobs_id_fk" FOREIGN KEY ("classificationJobId") REFERENCES "public"."classificationJobs"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_trainingJobId_trainingJobs_id_fk" FOREIGN KEY ("trainingJobId") REFERENCES "public"."trainingJobs"("id") ON DELETE no action ON UPDATE no action;

-- Add unique constraints
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_api_key_unique" UNIQUE("api_key");
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_sessionToken_unique" UNIQUE("sessionToken");
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");
ALTER TABLE "webhookResults" ADD CONSTRAINT "webhookResults_prediction_id_unique" UNIQUE("prediction_id");

-- Finally alter timestamp columns to include timezone
ALTER TABLE "accounts" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "accounts" ALTER COLUMN "lastUsed" SET DATA TYPE timestamp with time zone;
ALTER TABLE "bankAccounts" ALTER COLUMN "lastSync" SET DATA TYPE timestamp with time zone;
ALTER TABLE "bankAccounts" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;
ALTER TABLE "bankAccounts" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone;
ALTER TABLE "categories" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;
ALTER TABLE "categories" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone;
ALTER TABLE "categoryExpenses" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;
ALTER TABLE "categoryExpenses" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone;
ALTER TABLE "classificationJobs" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;
ALTER TABLE "classificationJobs" ALTER COLUMN "completedAt" SET DATA TYPE timestamp with time zone;
ALTER TABLE "embeddings" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "embeddings" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "monthlyAggregates" ALTER COLUMN "month" SET DATA TYPE timestamp with time zone;
ALTER TABLE "monthlyAggregates" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;
ALTER TABLE "monthlyAggregates" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone;
ALTER TABLE "sessions" ALTER COLUMN "expires" SET DATA TYPE timestamp with time zone;
ALTER TABLE "trainingJobs" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;
ALTER TABLE "trainingJobs" ALTER COLUMN "completedAt" SET DATA TYPE timestamp with time zone;
ALTER TABLE "transactions" ALTER COLUMN "date" SET DATA TYPE timestamp with time zone;
ALTER TABLE "transactions" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;
ALTER TABLE "transactions" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone;
ALTER TABLE "users" ALTER COLUMN "emailVerified" SET DATA TYPE timestamp with time zone;
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "users" ALTER COLUMN "password_updated_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "verificationTokens" ALTER COLUMN "expires" SET DATA TYPE timestamp with time zone;
ALTER TABLE "webhookResults" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone; 