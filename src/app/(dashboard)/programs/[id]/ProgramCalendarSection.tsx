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

  async function createCalendar() {
    setCreating(true);
    setError(null);
    const res = await fetch(`/api/admin/programs/${programId}/calendar`, { method: "POST" });
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
