"use client";

import { useState } from "react";
import type { Program } from "@/lib/db/schema";
import { ProgramsTable } from "./ProgramsTable";

export function ProgramsTabs({ active, inactive }: { active: Program[]; inactive: Program[] }) {
  const [tab, setTab] = useState<"active" | "inactive">("active");

  return (
    <div>
      <div className="mb-3 flex gap-1 border-b border-gray-200">
        <button
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            tab === "active" ? "border-brand text-brand-dark" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setTab("active")}
        >
          Active ({active.length})
        </button>
        <button
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            tab === "inactive" ? "border-brand text-brand-dark" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setTab("inactive")}
        >
          Inactive / Past ({inactive.length})
        </button>
      </div>

      {tab === "active" ? (
        <ProgramsTable programs={active} emptyMessage="No active programs yet — add your first one below." />
      ) : (
        <ProgramsTable programs={inactive} emptyMessage="Nothing inactive right now." />
      )}
    </div>
  );
}
