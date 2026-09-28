export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getProgram } from "@/lib/crm/programs";
import { listContactsByProgram } from "@/lib/crm/contacts";
import { getAppointmentTypeByProgramId } from "@/lib/crm/booking";
import { EditProgramForm } from "./EditProgramForm";
import { CopyEmailsButton } from "./CopyEmailsButton";
import { ProgramCalendarSection } from "./ProgramCalendarSection";

export default async function ProgramDetailPage({ params }: { params: { id: string } }) {
  const program = await getProgram(Number(params.id));
  if (!program) notFound();

  const [buyers, appointmentType] = await Promise.all([
    listContactsByProgram(program.id),
    getAppointmentTypeByProgramId(program.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/programs" className="text-sm text-brand hover:underline">← All programs</Link>
        <h1 className="mt-1 text-2xl font-semibold">{program.name}</h1>
        <p className="text-gray-500">{program.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">Edit program</h2>
          <EditProgramForm program={program} />
        </div>

        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Who bought this ({buyers.length})</h2>
            {buyers.length > 0 && <CopyEmailsButton emails={buyers.map((b) => b.email)} />}
          </div>
          {buyers.length === 0 ? (
            <p className="text-sm text-gray-500">No one yet.</p>
          ) : (
            <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
              {buyers.map((b) => (
                <li key={b.id}>
                  <Link href={`/contacts/${b.id}`} className="text-brand hover:underline">
                    {b.name}
                  </Link>
                  <span className="text-gray-500"> — {b.email}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-gray-400">
            Copy this list into an email, or set up a Funnel on the Email Funnels page tied to this
            program so anyone who buys it in the future gets your sequence automatically.
          </p>
        </div>
      </div>

      <ProgramCalendarSection programId={program.id} appointmentType={appointmentType ?? null} />
    </div>
  );
}
