CREATE TYPE "public"."subscriberSource" AS ENUM('SPREADSHEET', 'BETA_ACCESS', 'OTHER');--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"source" "subscriberSource" DEFAULT 'OTHER',
	"tags" json,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "subscribers_email_unique" UNIQUE("email")
);
