import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminRequest } from "@/lib/adminGuard";
import { getFunnel, updateFunnel } from "@/lib/crm/funnels";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  active: z.boolean().optional(),
  triggerEvent: z.enum(["purchase.completed", "registration.created"]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;
  const funnel = await getFunnel(Number(params.id));
  if (!funnel) return NextResponse.json({ error: "Funnel not found" }, { status: 404 });
  return NextResponse.json({ funnel });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update", details: parsed.error.flatten() }, { status: 400 });
  }

  const funnel = await updateFunnel(Number(params.id), parsed.data);
  return NextResponse.json({ funnel });
}
