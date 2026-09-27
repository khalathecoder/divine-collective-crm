export const dynamic = "force-dynamic";

import Link from "next/link";
import { listFunnels } from "@/lib/crm/funnels";
import { listPrograms } from "@/lib/crm/programs";
import { NewFunnelForm } from "./NewFunnelForm";

export default async function FunnelsPage() {
  const [funnels, programs] = await Promise.all([listFunnels(), listPrograms()]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Email Funnels</h1>
      <p className="text-sm text-gray-500">
        A funnel is a set of emails that go out automatically after someone buys (or registers for) a
        program. Tie a funnel to one program so only its buyers get it.
      </p>

      <div className="card overflow-hidden !p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Program</th>
              <th className="px-4 py-3">Triggers on</th>
              <th className="px-4 py-3">Steps</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {funnels.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/funnels/${f.id}`} className="font-medium text-brand hover:underline">
                    {f.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{f.program?.name ?? "Any program"}</td>
                <td className="px-4 py-3 text-gray-600">
                  {f.triggerEvent === "purchase.completed" ? "Purchase" : "Registration"}
                </td>
                <td className="px-4 py-3">{f.steps.length}</td>
                <td className="px-4 py-3">
                  <span className={f.active ? "text-green-600" : "text-gray-400"}>
                    {f.active ? "Active" : "Paused"}
                  </span>
                </td>
              </tr>
            ))}
            {funnels.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No funnels yet — create one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card max-w-lg">
        <h2 className="mb-3 font-semibold">Create a funnel</h2>
        <NewFunnelForm programs={programs.map((p) => ({ id: p.id, name: p.name }))} />
      </div>
    </div>
  );
}
