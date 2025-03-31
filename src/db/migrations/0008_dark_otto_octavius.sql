ALTER TABLE "users" ADD COLUMN "resetToken" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "resetTokenExpiry" timestamp with time zone;