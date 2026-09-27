import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { guardAdminRequest } from "@/lib/adminGuard";
import { db } from "@/lib/db";
import { appointmentTypes } from "@/lib/db/schema";

const createSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive().default(30),
  bufferMinutes: z.number().int().nonnegative().default(15),
  timezone: z.string().default("America/New_York"),
});

export async function GET(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;
  const types = await db.query.appointmentTypes.findMany({
    with: { availabilityRules: true, availabilityOverrides: true },
  });
  return NextResponse.json({ appointmentTypes: types });
}

export async function POST(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid appointment type", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.query.appointmentTypes.findFirst({ where: eq(appointmentTypes.slug, parsed.data.slug) });
  if (existing) return NextResponse.json({ error: "That slug is already used" }, { status: 409 });

  const [created] = await db.insert(appointmentTypes).values(parsed.data).returning();
  return NextResponse.json({ appointmentType: created }, { status: 201 });
}
