CREATE TYPE "public"."AppBetaOptInStatus" AS ENUM('OPTED_IN', 'DISMISSED');--> statement-breakpoint
CREATE TABLE "embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"embedding_id" text NOT NULL,
	"accountId" text,
	CONSTRAINT "embeddings_embedding_id_unique" UNIQUE("embedding_id")
);
--> statement-breakpoint
CREATE TABLE "webhook_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prediction_id" text NOT NULL,
	"results" json NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "webhook_results_prediction_id_unique" UNIQUE("prediction_id")
);
--> statement-breakpoint
ALTER TABLE "Account" ADD COLUMN "categorisationRange" text;--> statement-breakpoint
ALTER TABLE "Account" ADD COLUMN "categorisationTab" text;--> statement-breakpoint
ALTER TABLE "Account" ADD COLUMN "columnOrderCategorisation" json;--> statement-breakpoint
ALTER TABLE "Account" ADD COLUMN "api_key" text;--> statement-breakpoint
ALTER TABLE "Account" ADD COLUMN "created_at" timestamp;--> statement-breakpoint
ALTER TABLE "Account" ADD COLUMN "lastUsed" timestamp;--> statement-breakpoint
ALTER TABLE "Account" ADD COLUMN "requestsCount" text DEFAULT '0';--> statement-breakpoint
ALTER TABLE "Account" ADD COLUMN "appBetaOptIn" "AppBetaOptInStatus";--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_accountId_Account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Account" ADD CONSTRAINT "Account_api_key_unique" UNIQUE("api_key");