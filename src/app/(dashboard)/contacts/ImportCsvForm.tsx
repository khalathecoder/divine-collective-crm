"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface ImportResult {
  totalRows: number;
  processed: number;
  newActivity: number;
  alreadyImported: number;
  skippedNoEmail: number;
  purchasesRecorded: number;
  phoneOnlyPlaceholders: number;
}

export function ImportCsvForm() {
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
    const res = await fetch("/api/admin/contacts/import", {
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
    <div className="card max-w-lg">
      <h2 className="mb-2 font-semibold">Import from your website's admin export</h2>
      <p className="mb-3 text-sm text-gray-500">
        On the dicollectivellc.com admin page, use <strong>"Export all submissions as CSV"</strong>,
        then upload that file here. Every contact and what they submitted lands here, tagged by type
        — and for B.O.L.D. OUT, Crown Hour, and V.O.I.C.E. Activated, the actual amount paid too.
        Import your Programs first (Programs &amp; Pricing → "Import live programs") so those
        purchases have a program to attach to. Safe to run again with a newer export — it won't
        create duplicate contacts or double-count revenue.
      </p>
      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {result && (
        <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {result.newActivity} new activity entr{result.newActivity === 1 ? "y" : "ies"} added and{" "}
          {result.purchasesRecorded} new purchase(s) recorded, out of {result.totalRows} rows.
          {result.alreadyImported > 0 && ` ${result.alreadyImported} row(s) were already imported and left as-is.`}
          {result.skippedNoEmail > 0 && ` Skipped ${result.skippedNoEmail} row(s) with no email.`}
          {result.phoneOnlyPlaceholders > 0 &&
            ` ${result.phoneOnlyPlaceholders} contact(s) only have a phone number on file (tagged "no-real-email") — don't put them in an email funnel.`}
        </p>
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
