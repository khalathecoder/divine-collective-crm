export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";
import { NewAppointmentTypeForm } from "./NewAppointmentTypeForm";
import { AvailabilityEditor } from "./AvailabilityEditor";

export default async function AvailabilityPage() {
  const types = await db.query.appointmentTypes.findMany({
    with: { availabilityRules: true, availabilityOverrides: true, programs: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Availability</h1>
      <p className="text-sm text-gray-500">
        Set the days and hours people can book each calendar. A calendar used by only one program is
        independent — a time filled there never blocks another calendar. A calendar linked to several
        programs shares one pool of hours between them, so a booking on any of those programs blocks that
        time for all of them. Program-specific calendars are also managed from that program's own page.
      </p>

      {types.map((type) => (
        <div key={type.id}>
          {type.programs.length > 0 && (
            <p className="mb-1 text-xs text-gray-400">
              Linked to program{type.programs.length > 1 ? "s" : ""}:{" "}
              {type.programs.map((program, i) => (
                <span key={program.id}>
                  {i > 0 && ", "}
                  <Link href={`/programs/${program.id}`} className="text-brand hover:underline">
                    {program.name}
                  </Link>
                </span>
              ))}
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
