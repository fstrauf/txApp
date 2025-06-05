ALTER TABLE "subscriptions" ADD COLUMN "trialEndsAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "subscriptionPlan";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "subscriptionStatus";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "billingCycle";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "trialEndsAt";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "currentPeriodEndsAt";