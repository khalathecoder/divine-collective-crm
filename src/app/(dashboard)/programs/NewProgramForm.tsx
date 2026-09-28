"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TYPES_REQUIRING_CALENDAR = ["coaching", "event"];

export function NewProgramForm() {
  const router = useRouter();
  const [type, setType] = useState("coaching");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const needsCalendar = TYPES_REQUIRING_CALENDAR.includes(type);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const priceDollars = Number(form.get("price"));

    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: form.get("slug"),
        name: form.get("name"),
        description: form.get("description") || undefined,
        priceCents: Math.round(priceDollars * 100),
        type,
        calendar: needsCalendar
          ? {
              durationMinutes: Number(form.get("durationMinutes")),
              weekday: Number(form.get("weekday")),
              startTime: form.get("startTime"),
              endTime: form.get("endTime"),
            }
          : undefined,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create program");
      return;
    }
    router.refresh();
    e.currentTarget.reset();
    setType("coaching");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div>
        <label className="label">Program name</label>
        <input name="name" required className="input" placeholder="e.g. Called & Crowned (6-Week)" />
      </div>
      <div>
        <label className="label">Slug (used to link purchases from the website)</label>
        <input name="slug" required className="input" placeholder="called-crowned-6week" />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea name="description" className="input" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Price (USD)</label>
          <input name="price" type="number" min="0" step="0.01" required className="input" />
        </div>
        <div>
          <label className="label">Type</label>
          <select name="type" className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="coaching">Coaching</option>
            <option value="digital">Digital</option>
            <option value="event">Event</option>
            <option value="membership">Membership</option>
          </select>
        </div>
      </div>

      {needsCalendar && (
        <div className="rounded-md border border-brand/30 bg-brand/5 p-3">
          <p className="mb-2 text-sm font-medium text-brand-dark">
            Calendar setup (required for {type} programs)
          </p>
          <p className="mb-3 text-xs text-gray-500">
            Sets the first day/hours people can book this program. It gets its own independent
            calendar — you can add more days or change this any time from the program's page.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Day</label>
              <select name="weekday" className="input" defaultValue="1">
                {WEEKDAYS.map((day, i) => (
                  <option key={day} value={i}>{day}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">From</label>
              <input name="startTime" type="time" defaultValue="10:00" required className="input" />
            </div>
            <div>
              <label className="label">To</label>
              <input name="endTime" type="time" defaultValue="16:00" required className="input" />
            </div>
            <div>
              <label className="label">Duration (min)</label>
              <input name="durationMinutes" type="number" defaultValue={30} min={5} required className="input" />
            </div>
          </div>
        </div>
      )}

      <button className="btn" disabled={loading}>{loading ? "Adding..." : "Add program"}</button>
    </form>
  );
}
