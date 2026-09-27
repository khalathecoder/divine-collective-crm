import { and, eq } from "drizzle-orm";
import { db } from "../db";
import {
  funnels,
  funnelSteps,
  funnelEnrollments,
  type InsertFunnel,
  type InsertFunnelStep,
  type Funnel,
} from "../db/schema";

export async function listFunnels() {
  return db.query.funnels.findMany({
    with: { program: true, steps: true },
    orderBy: (f, { desc }) => [desc(f.createdAt)],
  });
}

export async function getFunnel(id: number) {
  return db.query.funnels.findFirst({
    where: eq(funnels.id, id),
    with: { program: true, steps: { orderBy: (s, { asc }) => [asc(s.stepOrder)] } },
  });
}

export async function createFunnel(input: InsertFunnel): Promise<Funnel> {
  const [created] = await db.insert(funnels).values(input).returning();
  if (!created) throw new Error("Failed to create funnel");
  return created;
}

export async function updateFunnel(id: number, input: Partial<InsertFunnel>): Promise<Funnel> {
  const [updated] = await db.update(funnels).set(input).where(eq(funnels.id, id)).returning();
  if (!updated) throw new Error("Funnel not found");
  return updated;
}

export async function addFunnelStep(input: InsertFunnelStep) {
  const [created] = await db.insert(funnelSteps).values(input).returning();
  if (!created) throw new Error("Failed to create funnel step");
  return created;
}

export async function updateFunnelStep(id: number, input: Partial<InsertFunnelStep>) {
  const [updated] = await db
    .update(funnelSteps)
    .set(input)
    .where(eq(funnelSteps.id, id))
    .returning();
  if (!updated) throw new Error("Funnel step not found");
  return updated;
}

export async function deleteFunnelStep(id: number) {
  await db.delete(funnelSteps).where(eq(funnelSteps.id, id));
}

/**
 * Enrolls a contact in every active funnel that matches the trigger event
 * (and program, when the funnel is program-specific). Skips a contact who is
 * already enrolled in that funnel.
 */
export async function enrollContactInMatchingFunnels(
  contactId: number,
  triggerEvent: string,
  programId?: number
): Promise<void> {
  const candidates = await db.query.funnels.findMany({
    where: (f, { eq: fEq, and: fAnd }) =>
      fAnd(fEq(f.active, true), fEq(f.triggerEvent, triggerEvent)),
    with: { steps: true },
  });

  for (const funnel of candidates) {
    if (funnel.programId && funnel.programId !== programId) continue;
    if (funnel.steps.length === 0) continue;

    const already = await db.query.funnelEnrollments.findFirst({
      where: and(eq(funnelEnrollments.contactId, contactId), eq(funnelEnrollments.funnelId, funnel.id)),
    });
    if (already) continue;

    const firstStep = [...funnel.steps].sort((a, b) => a.stepOrder - b.stepOrder)[0];
    if (!firstStep) continue;

    const nextSendAt = new Date(Date.now() + firstStep.delayHours * 60 * 60 * 1000);
    await db.insert(funnelEnrollments).values({
      contactId,
      funnelId: funnel.id,
      currentStep: 0,
      nextSendAt,
      status: "active",
    });
  }
}
