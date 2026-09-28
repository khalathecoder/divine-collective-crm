import Link from "next/link";
import type { Program } from "@/lib/db/schema";

export function ProgramsTable({ programs, emptyMessage }: { programs: Program[]; emptyMessage: string }) {
  return (
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
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
