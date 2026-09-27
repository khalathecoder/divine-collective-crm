import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminRequest } from "@/lib/adminGuard";
import { listPrograms, createProgram } from "@/lib/crm/programs";

const createSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().length(3).default("usd"),
  type: z.enum(["coaching", "digital", "event", "membership"]).default("coaching"),
  active: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;
  return NextResponse.json({ programs: await listPrograms() });
}

export async function POST(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid program", details: parsed.error.flatten() }, { status: 400 });
  }

  const program = await createProgram(parsed.data);
  return NextResponse.json({ program }, { status: 201 });
}
