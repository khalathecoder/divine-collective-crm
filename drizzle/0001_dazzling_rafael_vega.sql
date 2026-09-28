ALTER TABLE "appointment_types" ADD COLUMN "program_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "appointment_types" ADD CONSTRAINT "appointment_types_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "appointment_types_program_idx" ON "appointment_types" USING btree ("program_id");