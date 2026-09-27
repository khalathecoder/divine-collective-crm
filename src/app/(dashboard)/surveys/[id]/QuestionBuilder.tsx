"use client";

import { useState } from "react";
import type { SurveyQuestion } from "@/lib/db/schema";

export function QuestionBuilder({
  surveyId,
  initialQuestions,
}: {
  surveyId: number;
  initialQuestions: SurveyQuestion[];
}) {
  const [questions, setQuestions] = useState<SurveyQuestion[]>(initialQuestions);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function addQuestion() {
    setQuestions([
      ...questions,
      { id: `q${Date.now()}`, label: "", type: "text", required: true },
    ]);
  }

  function updateQuestion(id: string, patch: Partial<SurveyQuestion>) {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function removeQuestion(id: string) {
    setQuestions(questions.filter((q) => q.id !== id));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/admin/surveys/${surveyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <div key={q.id} className="grid grid-cols-1 gap-2 rounded-md border border-gray-200 p-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            className="input"
            placeholder="Question text"
            value={q.label}
            onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
          />
          <select
            className="input"
            value={q.type}
            onChange={(e) => updateQuestion(q.id, { type: e.target.value as SurveyQuestion["type"] })}
          >
            <option value="text">Short answer</option>
            <option value="textarea">Long answer</option>
            <option value="single_choice">Single choice</option>
            <option value="multiple_choice">Multiple choice</option>
          </select>
          <button onClick={() => removeQuestion(q.id)} className="text-xs text-red-600 hover:underline">
            Remove
          </button>
          {(q.type === "single_choice" || q.type === "multiple_choice") && (
            <input
              className="input sm:col-span-3"
              placeholder="Options, comma separated"
              value={(q.options ?? []).join(", ")}
              onChange={(e) =>
                updateQuestion(q.id, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })
              }
            />
          )}
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button onClick={addQuestion} className="btn-secondary">Add question</button>
        <button onClick={save} className="btn" disabled={saving}>{saving ? "Saving..." : "Save questions"}</button>
        {saved && <span className="text-sm text-green-600">Saved.</span>}
      </div>
    </div>
  );
}
