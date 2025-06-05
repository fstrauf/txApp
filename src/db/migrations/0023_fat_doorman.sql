ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_accountId_accounts_id_fk";
--> statement-breakpoint
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "subscriptions_stripeSubscriptionId_idx" ON "subscriptions" USING btree ("stripeSubscriptionId");--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "accountId";--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_stripeSubscriptionId_unique" UNIQUE("stripeSubscriptionId");--> statement-breakpoint
ALTER TABLE "public"."subscriptions" ALTER COLUMN "plan" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."subscriptionPlan";--> statement-breakpoint
CREATE TYPE "public"."subscriptionPlan" AS ENUM('FREE', 'TRIAL', 'GOLD');--> statement-breakpoint
ALTER TABLE "public"."subscriptions" ALTER COLUMN "plan" SET DATA TYPE "public"."subscriptionPlan" USING "plan"::"public"."subscriptionPlan";--> statement-breakpoint
ALTER TABLE "public"."subscriptions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."subscriptionStatus";--> statement-breakpoint
CREATE TYPE "public"."subscriptionStatus" AS ENUM('ACTIVE', 'CANCELED', 'EXPIRED');--> statement-breakpoint
ALTER TABLE "public"."subscriptions" ALTER COLUMN "status" SET DATA TYPE "public"."subscriptionStatus" USING "status"::"public"."subscriptionStatus";