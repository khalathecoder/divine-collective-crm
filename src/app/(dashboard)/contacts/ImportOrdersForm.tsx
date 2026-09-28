"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface ImportResult {
  totalRows: number;
  succeededRows: number;
  purchasesRecorded: number;
  skippedNoEmail: number;
  skippedNotSucceeded: number;
  unmatchedProducts: string[];
}

export function ImportOrdersForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    setResult(null);

    const csv = await file.text();
    const res = await fetch("/api/admin/contacts/import-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Import failed");
      return;
    }
    setResult(data);
    router.refresh();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="card">
      <h2 className="mb-2 font-semibold">Import orders (Called &amp; Crowned, digital guides)</h2>
      <p className="mb-3 text-sm text-gray-500">
        Use the website admin page's <strong>"Export orders as CSV"</strong>. Only rows marked{" "}
        <strong>succeeded</strong> are imported — pending/abandoned checkouts are skipped. Import your
        Programs first so purchases have something to attach to.
      </p>
      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {result && (
        <div className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          <p>
            {result.purchasesRecorded} new purchase(s) recorded from {result.succeededRows} succeeded
            row(s) (of {result.totalRows} total; {result.skippedNotSucceeded} weren't succeeded).
          </p>
          {result.skippedNoEmail > 0 && <p>{result.skippedNoEmail} succeeded row(s) had no customer email yet.</p>}
          {result.unmatchedProducts.length > 0 && (
            <p>Unrecognized product name(s), not imported: {result.unmatchedProducts.join(", ")}</p>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        disabled={loading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="text-sm"
      />
      {loading && <p className="mt-2 text-sm text-gray-500">Importing...</p>}
    </div>
  );
}
