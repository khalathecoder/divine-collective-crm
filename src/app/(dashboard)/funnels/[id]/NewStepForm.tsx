"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Survey } from "@/lib/db/schema";

export function NewStepForm({
  funnelId,
  nextOrder,
  surveys,
}: {
  funnelId: number;
  nextOrder: number;
  surveys: Survey[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const surveyId = form.get("surveyId");

    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/funnels/${funnelId}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stepOrder: nextOrder,
        delayHours: Number(form.get("delayHours")),
        subject: form.get("subject"),
        bodyHtml: (form.get("bodyHtml") as string).replaceAll("\n", "<br />"),
        surveyId: surveyId ? Number(surveyId) : null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not add step");
      return;
    }
    router.refresh();
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div>
        <label className="label">Send this many hours after the previous step (0 = right away)</label>
        <input name="delayHours" type="number" min={0} defaultValue={0} required className="input" />
      </div>
      <div>
        <label className="label">Subject line</label>
        <input name="subject" required className="input" />
      </div>
      <div>
        <label className="label">Email body</label>
        <textarea name="bodyHtml" required rows={6} className="input" placeholder="Hi {{first_name}}, ..." />
        <p className="mt-1 text-xs text-gray-400">Use {"{{first_name}}"} to personalize.</p>
      </div>
      <div>
        <label className="label">Include a survey link (optional)</label>
        <select name="surveyId" className="input">
          <option value="">None</option>
          {surveys.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <button className="btn" disabled={loading}>{loading ? "Adding..." : "Add step"}</button>
    </form>
  );
}
