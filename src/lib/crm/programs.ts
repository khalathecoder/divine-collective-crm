import { eq } from "drizzle-orm";
import { db } from "../db";
import { programs, type InsertProgram, type Program } from "../db/schema";

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
