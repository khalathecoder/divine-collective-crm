"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewFunnelForm({ programs }: { programs: { id: number; name: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const programId = form.get("programId");

    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/funnels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        programId: programId ? Number(programId) : null,
        triggerEvent: form.get("triggerEvent"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create funnel");
      return;
    }
    router.refresh();
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div>
        <label className="label">Funnel name</label>
        <input name="name" required className="input" placeholder="e.g. Called & Crowned Welcome Series" />
      </div>
      <div>
        <label className="label">Program (leave blank to apply to any program)</label>
        <select name="programId" className="input">
          <option value="">Any program</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Starts when someone...</label>
        <select name="triggerEvent" className="input">
          <option value="purchase.completed">Completes a purchase</option>
          <option value="registration.created">Registers (before paying)</option>
        </select>
      </div>
      <button className="btn" disabled={loading}>{loading ? "Creating..." : "Create funnel"}</button>
    </form>
  );
}
