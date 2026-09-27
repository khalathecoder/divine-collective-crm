"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface KeyRow {
  id: number;
  name: string;
  createdAt: string | Date;
  lastUsedAt: string | Date | null;
}

export function ApiKeyManager({ initialKeys }: { initialKeys: KeyRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/admin/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setCreating(false);
    if (res.ok) {
      const data = await res.json();
      setNewKey(data.rawKey);
      setName("");
      router.refresh();
    }
  }

  async function deleteKey(id: number) {
    await fetch(`/api/admin/api-keys?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {newKey && (
        <div className="card border-amber-300 bg-amber-50">
          <p className="text-sm font-medium text-amber-800">
            Copy this key now — you won't be able to see it again.
          </p>
          <code className="mt-2 block break-all rounded bg-white p-2 text-sm">{newKey}</code>
        </div>
      )}

      <div className="card overflow-hidden !p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Last used</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialKeys.map((k) => (
              <tr key={k.id}>
                <td className="px-4 py-3">{k.name}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(k.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-gray-500">
                  {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => deleteKey(k.id)} className="text-xs text-red-600 hover:underline">
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
            {initialKeys.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">No keys yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={createKey} className="card max-w-md space-y-3">
        <h2 className="font-semibold">Create a key</h2>
        <input
          className="input"
          placeholder="What's it for? e.g. 'Claude Code'"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button className="btn" disabled={creating}>{creating ? "Creating..." : "Create key"}</button>
      </form>
    </div>
  );
}
