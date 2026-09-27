export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getSurveyWithResponses } from "@/lib/crm/surveys";
import { QuestionBuilder } from "./QuestionBuilder";

export default async function SurveyDetailPage({ params }: { params: { id: string } }) {
  const survey = await getSurveyWithResponses(Number(params.id));
  if (!survey) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/surveys" className="text-sm text-brand hover:underline">← All surveys</Link>
        <h1 className="mt-1 text-2xl font-semibold">{survey.name}</h1>
        <p className="text-gray-500">Public link: <code>/survey/{survey.slug}</code></p>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Questions</h2>
        <QuestionBuilder surveyId={survey.id} initialQuestions={survey.questions} />
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Responses ({survey.responses.length})</h2>
        {survey.responses.length === 0 ? (
          <p className="text-sm text-gray-500">No responses yet.</p>
        ) : (
          <div className="space-y-4">
            {survey.responses.map((r) => (
              <div key={r.id} className="border-b border-gray-100 pb-3 last:border-0">
                <p className="text-sm font-medium">
                  <Link href={`/contacts/${r.contact.id}`} className="text-brand hover:underline">
                    {r.contact.name}
                  </Link>{" "}
                  <span className="text-gray-400">{new Date(r.submittedAt).toLocaleString()}</span>
                </p>
                <ul className="mt-1 text-sm text-gray-600">
                  {Object.entries(r.answers).map(([q, a]) => (
                    <li key={q}><span className="text-gray-400">{q}:</span> {a}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
