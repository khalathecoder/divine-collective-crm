import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminRequest } from "@/lib/adminGuard";
import { listFunnels, createFunnel } from "@/lib/crm/funnels";

const createSchema = z.object({
  name: z.string().min(1),
  programId: z.number().int().nullable().optional(),
  triggerEvent: z.enum(["purchase.completed", "registration.created"]).default("purchase.completed"),
  active: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;
  return NextResponse.json({ funnels: await listFunnels() });
}

export async function POST(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid funnel", details: parsed.error.flatten() }, { status: 400 });
  }

  const funnel = await createFunnel(parsed.data);
  return NextResponse.json({ funnel }, { status: 201 });
}
