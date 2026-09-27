"use client";

import { useState } from "react";
import type { SurveyQuestion } from "@/lib/db/schema";

export function SurveyForm({ slug, questions }: { slug: string; questions: SurveyQuestion[] }) {
  const [contactInfo, setContactInfo] = useState({ name: "", email: "", phone: "" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    const res = await fetch(`/api/survey/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...contactInfo, answers }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not submit your response.");
      setStatus("error");
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return <p className="card font-medium text-green-700">Thank you! Your response has been recorded.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div>
        <label className="label">Name</label>
        <input
          required
          className="input"
          value={contactInfo.name}
          onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Email</label>
        <input
          required
          type="email"
          className="input"
          value={contactInfo.email}
          onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
        />
      </div>

      {questions.map((q) => (
        <div key={q.id}>
          <label className="label">{q.label}</label>
          {q.type === "textarea" ? (
            <textarea
              required={q.required}
              className="input"
              rows={3}
              onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
            />
          ) : q.type === "single_choice" ? (
            <select
              required={q.required}
              className="input"
              onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
            >
              <option value="">Choose one...</option>
              {(q.options ?? []).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : q.type === "multiple_choice" ? (
            <div className="space-y-1">
              {(q.options ?? []).map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      const current = answers[q.label]?.split(", ").filter(Boolean) ?? [];
                      const next = e.target.checked ? [...current, opt] : current.filter((o) => o !== opt);
                      setAnswers({ ...answers, [q.label]: next.join(", ") });
                    }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ) : (
            <input
              required={q.required}
              className="input"
              onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
            />
          )}
        </div>
      ))}

      <button className="btn w-full" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
