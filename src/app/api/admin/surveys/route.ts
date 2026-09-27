import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminRequest } from "@/lib/adminGuard";
import { listSurveys, createSurvey } from "@/lib/crm/surveys";

const questionSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["text", "textarea", "single_choice", "multiple_choice"]),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
});

const createSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  questions: z.array(questionSchema).default([]),
});

export async function GET(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;
  return NextResponse.json({ surveys: await listSurveys() });
}

export async function POST(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid survey", details: parsed.error.flatten() }, { status: 400 });
  }

  const survey = await createSurvey(parsed.data);
  return NextResponse.json({ survey }, { status: 201 });
}
