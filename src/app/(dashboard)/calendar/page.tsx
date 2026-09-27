export const dynamic = "force-dynamic";

import Link from "next/link";
import { gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments } from "@/lib/db/schema";

export default async function CalendarPage() {
  const upcoming = await db.query.appointments.findMany({
    where: gte(appointments.startAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    with: { contact: true, appointmentType: true },
    orderBy: (a, { asc }) => [asc(a.startAt)],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <Link href="/calendar/availability" className="btn-secondary">Manage availability</Link>
      </div>

      <div className="card overflow-hidden !p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {upcoming.map((appt) => (
              <tr key={appt.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{new Date(appt.startAt).toLocaleString()}</td>
                <td className="px-4 py-3">{appt.appointmentType.name}</td>
                <td className="px-4 py-3">
                  <Link href={`/contacts/${appt.contact.id}`} className="text-brand hover:underline">
                    {appt.contact.name}
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize">{appt.status}</td>
              </tr>
            ))}
            {upcoming.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  Nothing booked yet. Share your booking page: <code>/book</code>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
