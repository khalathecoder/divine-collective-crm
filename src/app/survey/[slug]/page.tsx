export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getSurveyBySlug } from "@/lib/crm/surveys";
import { SurveyForm } from "./SurveyForm";

export default async function PublicSurveyPage({ params }: { params: { slug: string } }) {
  const survey = await getSurveyBySlug(params.slug);
  if (!survey) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold text-brand-dark">{survey.name}</h1>
      <SurveyForm slug={survey.slug} questions={survey.questions} />
    </div>
  );
}
