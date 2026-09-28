"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewContactForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const tags = (form.get("tags") as string)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone") || undefined,
        notes: form.get("notes") || undefined,
        tags,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not add contact");
      return;
    }
    router.refresh();
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Name</label>
          <input name="name" required className="input" />
        </div>
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" required className="input" />
        </div>
        <div>
          <label className="label">Phone (optional)</label>
          <input name="phone" className="input" />
        </div>
        <div>
          <label className="label">Tags (comma separated)</label>
          <input name="tags" className="input" placeholder="vip, called-crowned" />
        </div>
      </div>
      <div>
        <label className="label">Notes (optional)</label>
        <textarea name="notes" className="input" rows={2} />
      </div>
      <button className="btn" disabled={loading}>{loading ? "Adding..." : "Add contact"}</button>
    </form>
  );
}
