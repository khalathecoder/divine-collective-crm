"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewProgramForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const priceDollars = Number(form.get("price"));

    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: form.get("slug"),
        name: form.get("name"),
        description: form.get("description") || undefined,
        priceCents: Math.round(priceDollars * 100),
        type: form.get("type"),
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create program");
      return;
    }
    router.refresh();
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div>
        <label className="label">Program name</label>
        <input name="name" required className="input" placeholder="e.g. Called & Crowned (6-Week)" />
      </div>
      <div>
        <label className="label">Slug (used to link purchases from the website)</label>
        <input name="slug" required className="input" placeholder="called-crowned-6week" />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea name="description" className="input" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Price (USD)</label>
          <input name="price" type="number" min="0" step="0.01" required className="input" />
        </div>
        <div>
          <label className="label">Type</label>
          <select name="type" className="input">
            <option value="coaching">Coaching</option>
            <option value="digital">Digital</option>
            <option value="event">Event</option>
            <option value="membership">Membership</option>
          </select>
        </div>
      </div>
      <button className="btn" disabled={loading}>{loading ? "Adding..." : "Add program"}</button>
    </form>
  );
}
