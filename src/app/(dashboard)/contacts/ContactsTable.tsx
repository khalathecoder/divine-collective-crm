"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Contact } from "@/lib/db/schema";

export function ContactsTable({ contacts }: { contacts: Contact[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const allSelected = contacts.length > 0 && selected.size === contacts.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(contacts.map((c) => c.id)));
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} contact(s)? This can't be undone.`)) return;

    setDeleting(true);
    await Promise.all(
      Array.from(selected).map((id) => fetch(`/api/admin/contacts/${id}`, { method: "DELETE" }))
    );
    setDeleting(false);
    setSelected(new Set());
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-md bg-amber-50 px-4 py-2 text-sm">
          <span>{selected.size} selected</span>
          <button
            onClick={deleteSelected}
            disabled={deleting}
            className="font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete selected"}
          </button>
          <button onClick={() => setSelected(new Set())} className="text-gray-500 hover:underline">
            Clear selection
          </button>
        </div>
      )}

      <div className="card overflow-hidden !p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
              </th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {contacts.map((c) => (
              <tr key={c.id} className={`hover:bg-gray-50 ${selected.has(c.id) ? "bg-brand/5" : ""}`}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggleOne(c.id)}
                    aria-label={`Select ${c.name}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/contacts/${c.id}`} className="font-medium text-brand hover:underline">
                    {c.name}
                  </Link>
                  {c.unsubscribedAt && (
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      Unsubscribed
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{c.email}</td>
                <td className="px-4 py-3 text-gray-600">{c.phone ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{c.source ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand-dark">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No contacts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
