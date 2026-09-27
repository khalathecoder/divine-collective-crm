export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { NewAppointmentTypeForm } from "./NewAppointmentTypeForm";
import { AvailabilityEditor } from "./AvailabilityEditor";

export default async function AvailabilityPage() {
  const types = await db.query.appointmentTypes.findMany({
    with: { availabilityRules: true, availabilityOverrides: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Availability</h1>
      <p className="text-sm text-gray-500">
        Set the days and hours people can book each appointment type. Bookable slots on your public
        page respect these rules automatically.
      </p>

      {types.map((type) => (
        <AvailabilityEditor key={type.id} type={type} />
      ))}

      <div className="card max-w-lg">
        <h2 className="mb-3 font-semibold">Add an appointment type</h2>
        <NewAppointmentTypeForm />
      </div>
    </div>
  );
}
