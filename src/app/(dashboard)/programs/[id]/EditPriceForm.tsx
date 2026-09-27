"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EditPriceForm({ programId, currentPriceCents }: { programId: number; currentPriceCents: number }) {
  const router = useRouter();
  const [price, setPrice] = useState((currentPriceCents / 100).toFixed(2));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch(`/api/admin/programs/${programId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceCents: Math.round(Number(price) * 100) }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div>
        <label className="label">Price (USD)</label>
        <input
          className="input w-32"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <button className="btn" disabled={saving}>{saving ? "Saving..." : "Update price"}</button>
      {saved && <span className="text-sm text-green-600">Saved.</span>}
    </form>
  );
}
