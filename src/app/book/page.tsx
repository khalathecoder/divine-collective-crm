export const dynamic = "force-dynamic";

import Link from "next/link";
import { listAppointmentTypes } from "@/lib/crm/booking";

export default async function BookIndexPage() {
  const types = await listAppointmentTypes();

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold text-brand-dark">Book a time with Divine Collective</h1>
      <div className="space-y-3">
        {types.map((type) => (
          <Link
            key={type.id}
            href={`/book/${type.slug}`}
            className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-brand"
          >
            <p className="font-medium">{type.name}</p>
            <p className="text-sm text-gray-500">{type.durationMinutes} minutes</p>
          </Link>
        ))}
        {types.length === 0 && <p className="text-gray-500">Nothing available to book right now.</p>}
      </div>
    </div>
  );
}
