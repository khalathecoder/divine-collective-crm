import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminRequest } from "@/lib/adminGuard";
import { updateProgram, getProgram } from "@/lib/crm/programs";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  priceCents: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  type: z.enum(["coaching", "digital", "event", "membership"]).optional(),
  active: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;
  const program = await getProgram(Number(params.id));
  if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });
  return NextResponse.json({ program });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const program = await updateProgram(Number(params.id), parsed.data);
    return NextResponse.json({ program });
  } catch {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }
}
