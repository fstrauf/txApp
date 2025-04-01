CREATE TYPE "public"."billingCycle" AS ENUM('MONTHLY', 'ANNUAL');--> statement-breakpoint
CREATE TYPE "public"."subscriptionPlan" AS ENUM('FREE', 'SILVER', 'GOLD');--> statement-breakpoint
CREATE TYPE "public"."subscriptionStatus" AS ENUM('ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING');--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"accountId" text NOT NULL,
	"status" "subscriptionStatus" NOT NULL,
	"plan" "subscriptionPlan" NOT NULL,
	"billingCycle" "billingCycle" NOT NULL,
	"currentPeriodStart" timestamp with time zone NOT NULL,
	"currentPeriodEnd" timestamp with time zone NOT NULL,
	"cancelAtPeriodEnd" boolean DEFAULT false,
	"stripeSubscriptionId" text,
	"stripeCustomerId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "subscriptionPlan" "subscriptionPlan" DEFAULT 'FREE';--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "subscriptionStatus" "subscriptionStatus";--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "billingCycle" "billingCycle";--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "stripeCustomerId" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "stripeSubscriptionId" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "trialEndsAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "currentPeriodEndsAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "monthlyCategorizations" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "categoriesResetDate" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_accountId_accounts_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;