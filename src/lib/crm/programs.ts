import { eq } from "drizzle-orm";
import { db, getDb } from "../db";
import {
  programs,
  appointmentTypes,
  availabilityRules,
  type InsertProgram,
  type Program,
  type AppointmentType,
} from "../db/schema";

/** Program types that inherently involve a scheduled session or event, not just an instant download. */
export const PROGRAM_TYPES_REQUIRING_CALENDAR = ["coaching", "event"] as const;

export function programTypeRequiresCalendar(type: string): boolean {
  return (PROGRAM_TYPES_REQUIRING_CALENDAR as readonly string[]).includes(type);
}

export async function listPrograms(): Promise<Program[]> {
  return db.query.programs.findMany({ orderBy: (p, { asc }) => [asc(p.name)] });
}

export async function getProgram(id: number): Promise<Program | undefined> {
  return db.query.programs.findFirst({ where: eq(programs.id, id) });
}

export async function getProgramBySlug(slug: string): Promise<Program | undefined> {
  return db.query.programs.findFirst({ where: eq(programs.slug, slug) });
}

export async function createProgram(input: InsertProgram): Promise<Program> {
  const [created] = await db.insert(programs).values(input).returning();
  if (!created) throw new Error("Failed to create program");
  return created;
}

export interface InitialCalendarInput {
  durationMinutes: number;
  bufferMinutes: number;
  timezone: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

/**
 * Creates a program and, in the same transaction, its dedicated calendar
 * with one starting weekly availability rule. Used when the program's type
 * requires a calendar (coaching/event) — see programTypeRequiresCalendar —
 * so a bookable program can never exist with zero bookable hours.
 */
export async function createProgramWithCalendar(
  programInput: InsertProgram,
  calendar: InitialCalendarInput
): Promise<{ program: Program; appointmentType: AppointmentType }> {
  return getDb().transaction(async (tx) => {
    const [program] = await tx.insert(programs).values(programInput).returning();
    if (!program) throw new Error("Failed to create program");

    const [appointmentType] = await tx
      .insert(appointmentTypes)
      .values({
        slug: program.slug,
        name: program.name,
        durationMinutes: calendar.durationMinutes,
        bufferMinutes: calendar.bufferMinutes,
        timezone: calendar.timezone,
        programId: program.id,
      })
      .returning();
    if (!appointmentType) throw new Error("Failed to create calendar");

    await tx.insert(availabilityRules).values({
      appointmentTypeId: appointmentType.id,
      weekday: calendar.weekday,
      startTime: calendar.startTime,
      endTime: calendar.endTime,
    });

    return { program, appointmentType };
  });
}

export async function updateProgram(
  id: number,
  input: Partial<InsertProgram>
): Promise<Program> {
  const [updated] = await db
    .update(programs)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(programs.id, id))
    .returning();
  if (!updated) throw new Error("Program not found");
  return updated;
}

/** The one thing Nancy asked for by name: change the price on demand. */
export async function updateProgramPrice(id: number, priceCents: number): Promise<Program> {
  return updateProgram(id, { priceCents });
}
