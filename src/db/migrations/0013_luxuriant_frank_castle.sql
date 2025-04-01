ALTER TABLE "accounts" DROP CONSTRAINT "accounts_api_key_unique";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "api_key" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscriptionPlan" "subscriptionPlan" DEFAULT 'FREE';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscriptionStatus" "subscriptionStatus";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "billingCycle" "billingCycle";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripeCustomerId" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripeSubscriptionId" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trialEndsAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "currentPeriodEndsAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "monthlyCategorizations" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "categoriesResetDate" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "api_key";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "subscriptionPlan";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "subscriptionStatus";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "billingCycle";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "stripeCustomerId";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "stripeSubscriptionId";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "trialEndsAt";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "currentPeriodEndsAt";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "monthlyCategorizations";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "categoriesResetDate";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_api_key_unique" UNIQUE("api_key");