import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSurveyBySlug, submitSurveyResponse } from "@/lib/crm/surveys";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const survey = await getSurveyBySlug(params.slug);
  if (!survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  return NextResponse.json({ survey: { name: survey.name, questions: survey.questions } });
}

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  answers: z.record(z.string()),
});

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid response", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const response = await submitSurveyResponse({ surveySlug: params.slug, ...parsed.data });
    return NextResponse.json({ response }, { status: 201 });
  } catch (error) {
    console.error("[survey] submit failed:", error);
    return NextResponse.json({ error: "Could not save your response" }, { status: 500 });
  }
}
