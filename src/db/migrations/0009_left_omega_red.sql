ALTER TABLE "sessions" DROP CONSTRAINT "sessions_sessionToken_unique";--> statement-breakpoint
ALTER TABLE "sessions" ADD PRIMARY KEY ("sessionToken");--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "id" text NOT NULL;