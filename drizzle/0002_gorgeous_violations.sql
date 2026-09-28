ALTER TABLE "contacts" ADD COLUMN "unsubscribe_token" varchar(64);--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "unsubscribed_at" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "contacts_unsubscribe_token_idx" ON "contacts" USING btree ("unsubscribe_token");