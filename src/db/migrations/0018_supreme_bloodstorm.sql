CREATE TYPE "public"."transactionType" AS ENUM('credit', 'debit');--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "type" SET DATA TYPE transactionType;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "classifyApiKey";