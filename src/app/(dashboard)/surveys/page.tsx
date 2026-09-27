export const dynamic = "force-dynamic";

import Link from "next/link";
import { listSurveys } from "@/lib/crm/surveys";
import { NewSurveyForm } from "./NewSurveyForm";

export default async function SurveysPage() {
  const surveys = await listSurveys();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Surveys</h1>
      <p className="text-sm text-gray-500">
        Build a survey once, then link it from a funnel email or share <code>/survey/&lt;slug&gt;</code> directly.
      </p>

      <div className="card overflow-hidden !p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Questions</th>
              <th className="px-4 py-3">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {surveys.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/surveys/${s.id}`} className="font-medium text-brand hover:underline">
                    {s.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{s.questions.length}</td>
                <td className="px-4 py-3 text-gray-500">/survey/{s.slug}</td>
              </tr>
            ))}
            {surveys.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                  No surveys yet — create one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card max-w-lg">
        <h2 className="mb-3 font-semibold">Create a survey</h2>
        <NewSurveyForm />
      </div>
    </div>
  );
}
