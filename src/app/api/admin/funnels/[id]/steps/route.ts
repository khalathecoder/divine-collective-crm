import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminRequest } from "@/lib/adminGuard";
import { addFunnelStep } from "@/lib/crm/funnels";

const schema = z.object({
  stepOrder: z.number().int().nonnegative(),
  delayHours: z.number().int().nonnegative(),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
  surveyId: z.number().int().nullable().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid step", details: parsed.error.flatten() }, { status: 400 });
  }

  const step = await addFunnelStep({ funnelId: Number(params.id), ...parsed.data });
  return NextResponse.json({ step }, { status: 201 });
}
