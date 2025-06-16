ALTER TABLE "users" ADD COLUMN "spreadsheetUrl" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "spreadsheetId" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lastDataRefresh" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emailRemindersEnabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "oauthRefreshToken" text;