export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";
import { NewAppointmentTypeForm } from "./NewAppointmentTypeForm";
import { AvailabilityEditor } from "./AvailabilityEditor";

export default async function AvailabilityPage() {
  const types = await db.query.appointmentTypes.findMany({
    with: { availabilityRules: true, availabilityOverrides: true, program: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Availability</h1>
      <p className="text-sm text-gray-500">
        Set the days and hours people can book each calendar. Each one is independent — a time filled
        on one never blocks or shows as busy on another. Program-specific calendars are also managed
        from that program's own page.
      </p>

      {types.map((type) => (
        <div key={type.id}>
          {type.program && (
            <p className="mb-1 text-xs text-gray-400">
              Linked to program:{" "}
              <Link href={`/programs/${type.program.id}`} className="text-brand hover:underline">
                {type.program.name}
              </Link>
            </p>
          )}
          <AvailabilityEditor type={type} />
        </div>
      ))}

      <div className="card max-w-lg">
        <h2 className="mb-3 font-semibold">Add an appointment type</h2>
        <NewAppointmentTypeForm />
      </div>
    </div>
  );
}
