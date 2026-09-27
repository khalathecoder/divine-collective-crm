export const dynamic = "force-dynamic";

import Link from "next/link";
import { listPrograms } from "@/lib/crm/programs";
import { NewProgramForm } from "./NewProgramForm";

export default async function ProgramsPage() {
  const programs = await listPrograms();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Programs & Pricing</h1>

      <div className="card overflow-hidden !p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {programs.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/programs/${p.id}`} className="font-medium text-brand hover:underline">
                    {p.name}
                  </Link>
                  <p className="text-xs text-gray-400">{p.slug}</p>
                </td>
                <td className="px-4 py-3 text-gray-600 capitalize">{p.type}</td>
                <td className="px-4 py-3">${(p.priceCents / 100).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={p.active ? "text-green-600" : "text-gray-400"}>
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
            {programs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No programs yet — add your first one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card max-w-lg">
        <h2 className="mb-3 font-semibold">Add a program</h2>
        <NewProgramForm />
      </div>
    </div>
  );
}
