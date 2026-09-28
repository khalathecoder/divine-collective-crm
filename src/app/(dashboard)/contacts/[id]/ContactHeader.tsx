"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Contact } from "@/lib/db/schema";

export function ContactHeader({ contact }: { contact: Contact }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: contact.name,
    email: contact.email,
    phone: contact.phone ?? "",
    tags: contact.tags.join(", "),
    notes: contact.notes ?? "",
  });

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        notes: form.notes || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save changes");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete ${contact.name}? This can't be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/admin/contacts/${contact.id}`, { method: "DELETE" });
    router.push("/contacts");
    router.refresh();
  }

  if (editing) {
    return (
      <div className="card max-w-lg space-y-3">
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div>
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="label">Tags (comma separated)</label>
          <input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea
            className="input"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          <button className="btn-secondary" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold">
          {contact.name}
          {contact.unsubscribedAt && (
            <span className="ml-2 align-middle rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-500">
              Unsubscribed {new Date(contact.unsubscribedAt).toLocaleDateString()}
            </span>
          )}
        </h1>
        <p className="text-gray-500">
          {contact.email}
          {contact.phone ? ` · ${contact.phone}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {contact.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand-dark">
              {tag}
            </span>
          ))}
        </div>
        {contact.notes && <p className="mt-2 max-w-lg text-sm text-gray-600">{contact.notes}</p>}
      </div>
      <div className="flex shrink-0 gap-2">
        <button className="btn-secondary" onClick={() => setEditing(true)}>Edit</button>
        <button className="text-sm text-red-600 hover:underline" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
