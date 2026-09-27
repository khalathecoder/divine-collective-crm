"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewSurveyForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: form.get("slug"), name: form.get("name"), questions: [] }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create survey");
      return;
    }
    router.refresh();
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div>
        <label className="label">Survey name</label>
        <input name="name" required className="input" placeholder="e.g. Pre-Program Intake" />
      </div>
      <div>
        <label className="label">Slug (for the link)</label>
        <input name="slug" required className="input" placeholder="pre-program-intake" />
      </div>
      <button className="btn" disabled={loading}>{loading ? "Creating..." : "Create survey"}</button>
    </form>
  );
}
