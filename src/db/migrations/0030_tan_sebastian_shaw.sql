CREATE TYPE "public"."emailSequenceStatus" AS ENUM('EMAIL_1_SENT', 'EMAIL_2_SENT', 'EMAIL_3_SENT', 'COMPLETED');--> statement-breakpoint
ALTER TYPE "public"."subscriberSource" ADD VALUE 'SPREADSHEET_POPUP' BEFORE 'BETA_ACCESS';--> statement-breakpoint
ALTER TABLE "subscribers" ADD COLUMN "emailSequenceStatus" "emailSequenceStatus";--> statement-breakpoint
ALTER TABLE "subscribers" ADD COLUMN "lastEmailSent" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscribers" ADD COLUMN "nextEmailDue" timestamp with time zone;