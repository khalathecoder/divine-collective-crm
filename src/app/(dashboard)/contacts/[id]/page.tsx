export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getContactWithHistory } from "@/lib/crm/contacts";

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const result = await getContactWithHistory(Number(params.id));
  if (!result) notFound();

  const { contact, events, purchases, appointments, surveyResponses } = result;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{contact.name}</h1>
        <p className="text-gray-500">{contact.email}{contact.phone ? ` · ${contact.phone}` : ""}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {contact.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand-dark">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">Purchases</h2>
          {purchases.length === 0 ? (
            <p className="text-sm text-gray-500">No purchases yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {purchases.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>{p.program.name}</span>
                  <span className="text-gray-500">${(p.amountPaidCents / 100).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold">Appointments</h2>
          {appointments.length === 0 ? (
            <p className="text-sm text-gray-500">None booked.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {appointments.map((a) => (
                <li key={a.id} className="flex justify-between">
                  <span>{a.appointmentType.name}</span>
                  <span className="text-gray-500">{new Date(a.startAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card lg:col-span-2">
          <h2 className="mb-3 font-semibold">Survey responses</h2>
          {surveyResponses.length === 0 ? (
            <p className="text-sm text-gray-500">None yet.</p>
          ) : (
            <div className="space-y-4">
              {surveyResponses.map((r) => (
                <div key={r.id}>
                  <p className="text-sm font-medium">{r.survey.name}</p>
                  <ul className="mt-1 text-sm text-gray-600">
                    {Object.entries(r.answers).map(([q, a]) => (
                      <li key={q}>
                        <span className="text-gray-400">{q}:</span> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card lg:col-span-2">
          <h2 className="mb-3 font-semibold">Activity</h2>
          <ul className="space-y-2 text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex justify-between">
                <span>{e.label}</span>
                <span className="text-gray-400">{new Date(e.createdAt).toLocaleString()}</span>
              </li>
            ))}
            {events.length === 0 && <p className="text-sm text-gray-500">No activity recorded yet.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
