CREATE TABLE "monthlyReminders" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"isActive" boolean DEFAULT true,
	"lastSent" timestamp with time zone,
	"nextSend" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "monthlyReminders_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "monthlyReminders" ADD CONSTRAINT "monthlyReminders_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "monthly_reminders_user_id_idx" ON "monthlyReminders" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "monthly_reminders_next_send_idx" ON "monthlyReminders" USING btree ("nextSend");