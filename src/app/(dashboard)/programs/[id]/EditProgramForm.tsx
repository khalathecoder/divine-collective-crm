"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Program } from "@/lib/db/schema";

export function EditProgramForm({ program }: { program: Program }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: program.name,
    description: program.description ?? "",
    price: (program.priceCents / 100).toFixed(2),
    type: program.type,
    active: program.active,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const res = await fetch(`/api/admin/programs/${program.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        priceCents: Math.round(Number(form.price) * 100),
        type: form.type,
        active: form.active,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save changes");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div>
        <label className="label">Name</label>
        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          className="input"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Price (USD)</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Type</label>
          <select
            className="input"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as Program["type"] })}
          >
            <option value="coaching">Coaching</option>
            <option value="digital">Digital</option>
            <option value="event">Event</option>
            <option value="membership">Membership</option>
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm({ ...form, active: e.target.checked })}
        />
        Active — shown as available for sale / bookable
      </label>
      {!form.active && (
        <p className="text-xs text-gray-400">
          Marking a program inactive doesn't delete it or its history — it's just a flag you can use to
          note it's no longer being sold (e.g. a past event).
        </p>
      )}
      <div className="flex items-center gap-3">
        <button className="btn" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
        {saved && <span className="text-sm text-green-600">Saved.</span>}
      </div>
    </div>
  );
}
