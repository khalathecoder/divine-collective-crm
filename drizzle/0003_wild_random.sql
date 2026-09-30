ALTER TABLE "programs" ADD COLUMN "appointment_type_id" integer;--> statement-breakpoint
UPDATE "programs" SET "appointment_type_id" = "appointment_types"."id"
  FROM "appointment_types"
  WHERE "appointment_types"."program_id" = "programs"."id";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "programs" ADD CONSTRAINT "programs_appointment_type_id_appointment_types_id_fk" FOREIGN KEY ("appointment_type_id") REFERENCES "public"."appointment_types"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "appointment_types" DROP CONSTRAINT IF EXISTS "appointment_types_program_id_programs_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "appointment_types_program_idx";--> statement-breakpoint
ALTER TABLE "appointment_types" DROP COLUMN IF EXISTS "program_id";
