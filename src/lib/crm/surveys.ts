import { eq } from "drizzle-orm";
import { db } from "../db";
import { surveys, surveyResponses, type InsertSurvey, type SurveyQuestion } from "../db/schema";
import { logContactEvent, upsertContact } from "./contacts";

export async function listSurveys() {
  return db.query.surveys.findMany({ orderBy: (s, { desc }) => [desc(s.createdAt)] });
}

export async function getSurveyBySlug(slug: string) {
  return db.query.surveys.findFirst({ where: eq(surveys.slug, slug) });
}

export async function getSurveyWithResponses(id: number) {
  return db.query.surveys.findFirst({
    where: eq(surveys.id, id),
    with: { responses: { with: { contact: true }, orderBy: (r, { desc }) => [desc(r.submittedAt)] } },
  });
}

export async function createSurvey(input: InsertSurvey) {
  const [created] = await db.insert(surveys).values(input).returning();
  if (!created) throw new Error("Failed to create survey");
  return created;
}

export async function updateSurveyQuestions(id: number, questions: SurveyQuestion[]) {
  const [updated] = await db.update(surveys).set({ questions }).where(eq(surveys.id, id)).returning();
  if (!updated) throw new Error("Survey not found");
  return updated;
}

export interface SubmitSurveyInput {
  surveySlug: string;
  name: string;
  email: string;
  phone?: string;
  answers: Record<string, string>;
}

export async function submitSurveyResponse(input: SubmitSurveyInput) {
  const survey = await getSurveyBySlug(input.surveySlug);
  if (!survey) throw new Error(`Survey "${input.surveySlug}" not found`);

  const contact = await upsertContact({ name: input.name, email: input.email, phone: input.phone });

  const [response] = await db
    .insert(surveyResponses)
    .values({ surveyId: survey.id, contactId: contact.id, answers: input.answers })
    .returning();
  if (!response) throw new Error("Failed to save survey response");

  await logContactEvent(contact.id, "survey.submitted", `Completed survey "${survey.name}"`, {
    surveyId: survey.id,
  });

  return response;
}
