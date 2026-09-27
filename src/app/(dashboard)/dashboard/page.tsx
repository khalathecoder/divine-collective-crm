export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { contacts, purchases, appointments, funnelEnrollments } from "@/lib/db/schema";
import { eq, gte, and } from "drizzle-orm";
import Link from "next/link";

export default async function DashboardPage() {
  const [contactCount, purchaseRows, upcomingAppointments, activeEnrollments] = await Promise.all([
    db.$count(contacts),
    db.select().from(purchases),
    db.query.appointments.findMany({
      where: and(eq(appointments.status, "confirmed"), gte(appointments.startAt, new Date())),
      with: { contact: true, appointmentType: true },
      orderBy: (a, { asc }) => [asc(a.startAt)],
      limit: 5,
    }),
    db.$count(funnelEnrollments, eq(funnelEnrollments.status, "active")),
  ]);

  const totalRevenueCents = purchaseRows.reduce((sum, p) => sum + p.amountPaidCents, 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Overview</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Contacts" value={contactCount.toString()} href="/contacts" />
        <StatCard label="Purchases" value={purchaseRows.length.toString()} href="/programs" />
        <StatCard label="Total revenue" value={`$${(totalRevenueCents / 100).toLocaleString()}`} />
        <StatCard label="Active email funnels" value={activeEnrollments.toString()} href="/funnels" />
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Next 5 appointments</h2>
          <Link href="/calendar" className="text-sm text-brand hover:underline">View calendar</Link>
        </div>
        {upcomingAppointments.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing booked yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {upcomingAppointments.map((appt) => (
              <li key={appt.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <strong>{appt.contact.name}</strong> — {appt.appointmentType.name}
                </span>
                <span className="text-gray-500">{new Date(appt.startAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
