"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AppointmentType, AvailabilityRule, AvailabilityOverride } from "@/lib/db/schema";
import { AvailabilityEditor } from "../../calendar/availability/AvailabilityEditor";

type TypeWithAvailability = AppointmentType & {
  availabilityRules: AvailabilityRule[];
  availabilityOverrides: AvailabilityOverride[];
};

export function ProgramCalendarSection({
  programId,
  appointmentType,
}: {
  programId: number;
  appointmentType: TypeWithAvailability | null;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(15);

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

  if (!appointmentType) {
    return (
      <div className="card">
        <h2 className="mb-2 font-semibold">Calendar & Availability</h2>
        <p className="mb-3 text-sm text-gray-500">
          This program doesn't have its own booking calendar yet. Create one to set hours people can
          book for it — completely separate from every other program's calendar, so a time filled here
          never blocks a time on another program's schedule.
        </p>
        {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
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
          {creating ? "Creating..." : "Create a calendar for this program"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm text-gray-500">
        Public booking link: <code>/book/{appointmentType.slug}</code>
      </p>
      <AvailabilityEditor type={appointmentType} />
    </div>
  );
}
