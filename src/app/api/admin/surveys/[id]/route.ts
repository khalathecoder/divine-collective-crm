import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminRequest } from "@/lib/adminGuard";
import { getSurveyWithResponses, updateSurveyQuestions } from "@/lib/crm/surveys";

const questionSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["text", "textarea", "single_choice", "multiple_choice"]),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;
  const survey = await getSurveyWithResponses(Number(params.id));
  if (!survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  return NextResponse.json({ survey });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = z.object({ questions: z.array(questionSchema) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid questions", details: parsed.error.flatten() }, { status: 400 });
  }

  const survey = await updateSurveyQuestions(Number(params.id), parsed.data.questions);
  return NextResponse.json({ survey });
}
