"use client";

import { useEffect, useState } from "react";

interface Slot {
  start: string;
  end: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function BookingWidget({ typeSlug }: { typeSlug: string }) {
  const [date, setDate] = useState(todayIso());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingSlots(true);
    setSelected(null);
    fetch(`/api/book/${typeSlug}/availability?date=${date}`)
      .then((res) => res.json())
      .then((data) => setSlots(data.slots ?? []))
      .finally(() => setLoadingSlots(false));
  }, [date, typeSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setStatus("submitting");
    setError(null);
    const res = await fetch(`/api/book/${typeSlug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start: selected.start, ...form }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not book that time.");
      setStatus("error");
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="card">
        <p className="font-medium text-green-700">You're booked!</p>
        <p className="text-sm text-gray-500">Check your email for the confirmation and details.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Pick a date</label>
        <input type="date" min={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} className="input" />
      </div>

      <div>
        <label className="label">Available times</label>
        {loadingSlots ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-gray-400">No times available this day — try another date.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.start}
                type="button"
                onClick={() => setSelected(slot)}
                className={`rounded-md border px-2 py-2 text-sm ${
                  selected?.start === slot.start
                    ? "border-brand bg-brand text-white"
                    : "border-gray-300 hover:border-brand"
                }`}
              >
                {new Date(slot.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <form onSubmit={handleSubmit} className="card space-y-3">
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div>
            <label className="label">Name</label>
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              required
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <button className="btn w-full" disabled={status === "submitting"}>
            {status === "submitting" ? "Booking..." : "Confirm booking"}
          </button>
        </form>
      )}
    </div>
  );
}
