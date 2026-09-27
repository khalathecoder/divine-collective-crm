"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewAppointmentTypeForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/appointment-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: form.get("slug"),
        name: form.get("name"),
        durationMinutes: Number(form.get("durationMinutes")),
        bufferMinutes: Number(form.get("bufferMinutes")),
        timezone: form.get("timezone"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create appointment type");
      return;
    }
    router.refresh();
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div>
        <label className="label">Name</label>
        <input name="name" required className="input" placeholder="e.g. Strategy Session" />
      </div>
      <div>
        <label className="label">Slug (for the public booking link)</label>
        <input name="slug" required className="input" placeholder="strategy-session" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Duration (minutes)</label>
          <input name="durationMinutes" type="number" defaultValue={30} className="input" />
        </div>
        <div>
          <label className="label">Buffer after (minutes)</label>
          <input name="bufferMinutes" type="number" defaultValue={15} className="input" />
        </div>
      </div>
      <div>
        <label className="label">Timezone</label>
        <input name="timezone" defaultValue="America/New_York" className="input" />
      </div>
      <button className="btn" disabled={loading}>{loading ? "Adding..." : "Add appointment type"}</button>
    </form>
  );
}
