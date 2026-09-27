import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { guardAdminRequest } from "@/lib/adminGuard";
import { db } from "@/lib/db";
import { availabilityRules, availabilityOverrides } from "@/lib/db/schema";

const ruleSchema = z.object({
  appointmentTypeId: z.number().int(),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const overrideSchema = z.object({
  appointmentTypeId: z.number().int(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isBlocked: z.boolean().default(true),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  note: z.string().optional(),
});

/** Add a recurring weekly rule (?kind=rule, default) or a one-off date override (?kind=override). */
export async function POST(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const kind = req.nextUrl.searchParams.get("kind") ?? "rule";
  const body = await req.json().catch(() => null);

  if (kind === "override") {
    const parsed = overrideSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid override", details: parsed.error.flatten() }, { status: 400 });
    }
    const [created] = await db.insert(availabilityOverrides).values(parsed.data).returning();
    return NextResponse.json({ override: created }, { status: 201 });
  }

  const parsed = ruleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid rule", details: parsed.error.flatten() }, { status: 400 });
  }
  const [created] = await db.insert(availabilityRules).values(parsed.data).returning();
  return NextResponse.json({ rule: created }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const kind = req.nextUrl.searchParams.get("kind") ?? "rule";
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (kind === "override") {
    await db.delete(availabilityOverrides).where(eq(availabilityOverrides.id, id));
  } else {
    await db.delete(availabilityRules).where(eq(availabilityRules.id, id));
  }
  return NextResponse.json({ ok: true });
}
