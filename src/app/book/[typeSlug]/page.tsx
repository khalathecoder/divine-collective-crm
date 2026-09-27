export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getAppointmentTypeBySlug } from "@/lib/crm/booking";
import { BookingWidget } from "./BookingWidget";

export default async function BookTypePage({ params }: { params: { typeSlug: string } }) {
  const type = await getAppointmentTypeBySlug(params.typeSlug);
  if (!type || !type.active) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-brand-dark">{type.name}</h1>
        {type.description && <p className="text-gray-500">{type.description}</p>}
        <p className="mt-1 text-sm text-gray-400">{type.durationMinutes} minutes · {type.timezone}</p>
      </div>
      <BookingWidget typeSlug={type.slug} />
    </div>
  );
}
