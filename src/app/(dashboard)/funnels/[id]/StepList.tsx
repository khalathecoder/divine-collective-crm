"use client";

import { useRouter } from "next/navigation";
import type { FunnelStep, Survey } from "@/lib/db/schema";

export function StepList({ steps, surveys }: { steps: FunnelStep[]; surveys: Survey[] }) {
  const router = useRouter();
  const surveyById = new Map(surveys.map((s) => [s.id, s.name]));
  const ordered = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);

  async function removeStep(id: number) {
    await fetch(`/api/admin/funnels/steps/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (ordered.length === 0) {
    return <p className="text-sm text-gray-500">No steps yet — add the first one below.</p>;
  }

  return (
    <ol className="space-y-3">
      {ordered.map((step, index) => (
        <li key={step.id} className="rounded-md border border-gray-200 p-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400">
                Step {index + 1} · {step.delayHours === 0 ? "immediately" : `${step.delayHours}h after previous`}
                {step.surveyId ? ` · includes survey: ${surveyById.get(step.surveyId) ?? "—"}` : ""}
              </p>
              <p className="font-medium">{step.subject}</p>
              <div
                className="prose prose-sm mt-1 max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: step.bodyHtml }}
              />
            </div>
            <button onClick={() => removeStep(step.id)} className="text-xs text-red-600 hover:underline">
              Remove
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}
