import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminRequest } from "@/lib/adminGuard";
import { updateFunnelStep, deleteFunnelStep } from "@/lib/crm/funnels";

const schema = z.object({
  stepOrder: z.number().int().nonnegative().optional(),
  delayHours: z.number().int().nonnegative().optional(),
  subject: z.string().min(1).optional(),
  bodyHtml: z.string().min(1).optional(),
  surveyId: z.number().int().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { stepId: string } }) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update", details: parsed.error.flatten() }, { status: 400 });
  }

  const step = await updateFunnelStep(Number(params.stepId), parsed.data);
  return NextResponse.json({ step });
}

export async function DELETE(req: NextRequest, { params }: { params: { stepId: string } }) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;
  await deleteFunnelStep(Number(params.stepId));
  return NextResponse.json({ ok: true });
}
