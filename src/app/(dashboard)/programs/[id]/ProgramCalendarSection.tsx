"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AppointmentType, AvailabilityRule, AvailabilityOverride } from "@/lib/db/schema";
import { AvailabilityEditor } from "../../calendar/availability/AvailabilityEditor";

type TypeWithAvailability = AppointmentType & {
  availabilityRules: AvailabilityRule[];
  availabilityOverrides: AvailabilityOverride[];
};

export interface CalendarOption {
  id: number;
  name: string;
  slug: string;
  durationMinutes: number;
  bufferMinutes: number;
  programNames: string[];
}

export function ProgramCalendarSection({
  programId,
  appointmentType,
  availableCalendars,
}: {
  programId: number;
  appointmentType: TypeWithAvailability | null;
  availableCalendars: CalendarOption[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(15);

  const otherCalendars = availableCalendars.filter((c) => c.id !== appointmentType?.id);
  const [selectedCalendarId, setSelectedCalendarId] = useState<number | "">(otherCalendars[0]?.id ?? "");

  async function createCalendar() {
    setCreating(true);
    setError(null);
    const res = await fetch(`/api/admin/programs/${programId}/calendar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMinutes, bufferMinutes }),
    });
    setCreating(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create calendar");
      return;
    }
    router.refresh();
  }

  async function attachCalendar() {
    if (!selectedCalendarId) return;
    setAttaching(true);
    setError(null);
    const res = await fetch(`/api/admin/programs/${programId}/calendar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentTypeId: selectedCalendarId }),
    });
    setAttaching(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not switch calendars");
      return;
    }
    router.refresh();
  }

  const currentCalendarInfo = availableCalendars.find((c) => c.id === appointmentType?.id);

  return (
    <div className="card space-y-6">
      <div>
        <h2 className="mb-2 font-semibold">Calendar & Availability</h2>

        {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {!appointmentType ? (
          <>
            <p className="mb-3 text-sm text-gray-500">
              This program doesn't have a booking calendar yet. Either give it its own dedicated hours, or
              use an existing calendar below to share hours with another program.
            </p>
            <div className="mb-4 flex flex-wrap items-end gap-4">
              <label className="text-sm">
                <span className="mb-1 block text-gray-600">Session length (minutes)</span>
                <input
                  type="number"
                  min={5}
                  step={5}
                  className="input w-28"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-600">Buffer after each booking (minutes)</span>
                <input
                  type="number"
                  min={0}
                  step={5}
                  className="input w-28"
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(Number(e.target.value))}
                />
              </label>
            </div>
            <button className="btn" onClick={createCalendar} disabled={creating}>
              {creating ? "Creating..." : "Create a new calendar for this program"}
            </button>
          </>
        ) : (
          <>
            <p className="mb-1 text-sm text-gray-500">
              Using calendar: <strong>{appointmentType.name}</strong> ({appointmentType.durationMinutes} min,{" "}
              {appointmentType.bufferMinutes} min buffer)
            </p>
            {currentCalendarInfo && currentCalendarInfo.programNames.length > 1 && (
              <p className="mb-3 text-sm text-amber-700">
                Shared with:{" "}
                {currentCalendarInfo.programNames.filter((n, i, arr) => arr.indexOf(n) === i).join(", ")} — a
                booking on any of these programs blocks that time for all of them.
              </p>
            )}
            <p className="mb-3 text-sm text-gray-500">
              Public booking link: <code>/book/{appointmentType.slug}</code>
            </p>
            <AvailabilityEditor type={appointmentType} />
          </>
        )}
      </div>

      {otherCalendars.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="mb-2 text-sm font-semibold">
            {appointmentType ? "Switch to a different calendar" : "Or use an existing calendar"}
          </h3>
          <p className="mb-3 text-sm text-gray-500">
            Pick a calendar another program already uses to make this program share the same hours — a time
            booked on one blocks that time on the other automatically.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <select
              className="input w-72"
              value={selectedCalendarId}
              onChange={(e) => setSelectedCalendarId(Number(e.target.value))}
            >
              {otherCalendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.durationMinutes} min){" "}
                  {c.programNames.length > 0 ? `— used by: ${c.programNames.join(", ")}` : "— unused"}
                </option>
              ))}
            </select>
            <button className="btn" onClick={attachCalendar} disabled={attaching}>
              {attaching ? "Switching..." : "Use this calendar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
