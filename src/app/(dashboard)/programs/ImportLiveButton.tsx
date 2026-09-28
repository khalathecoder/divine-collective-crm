"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ImportLiveButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: string[]; skipped: string[] } | null>(null);

  async function handleClick() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/admin/programs/import-live", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setResult(data);
      router.refresh();
    }
  }

  return (
    <div>
      <button className="btn-secondary" onClick={handleClick} disabled={loading}>
        {loading ? "Importing..." : "Import live programs"}
      </button>
      {result && (
        <p className="mt-2 text-sm text-gray-500">
          {result.created.length > 0
            ? `Added: ${result.created.join(", ")}. `
            : ""}
          {result.skipped.length > 0
            ? `Already had: ${result.skipped.join(", ")}.`
            : ""}
          {result.created.length === 0 && result.skipped.length === 0 && "Nothing to import."}
        </p>
      )}
    </div>
  );
}
