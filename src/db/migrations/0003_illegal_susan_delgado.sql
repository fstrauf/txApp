ALTER TABLE "embeddings" DROP CONSTRAINT "embeddings_accountId_Account_userId_fk";
--> statement-breakpoint
ALTER TABLE "Account" ALTER COLUMN "expires_at" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_accountId_Account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "updatedAt";