"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AppointmentType, AvailabilityRule, AvailabilityOverride } from "@/lib/db/schema";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type TypeWithAvailability = AppointmentType & {
  availabilityRules: AvailabilityRule[];
  availabilityOverrides: AvailabilityOverride[];
};

export function AvailabilityEditor({ type }: { type: TypeWithAvailability }) {
  const router = useRouter();
  const [weekday, setWeekday] = useState("1");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("16:00");
  const [blockDate, setBlockDate] = useState("");

  async function addRule() {
    await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentTypeId: type.id, weekday: Number(weekday), startTime, endTime }),
    });
    router.refresh();
  }

  async function removeRule(id: number) {
    await fetch(`/api/admin/availability?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function blockDay() {
    if (!blockDate) return;
    await fetch("/api/admin/availability?kind=override", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentTypeId: type.id, date: blockDate, isBlocked: true }),
    });
    setBlockDate("");
    router.refresh();
  }

  async function removeOverride(id: number) {
    await fetch(`/api/admin/availability?kind=override&id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="font-semibold">{type.name}</h2>
        <p className="text-xs text-gray-400">
          {type.durationMinutes} min · booking link: <code>/book/{type.slug}</code>
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Weekly availability</p>
        <ul className="mb-3 space-y-1 text-sm">
          {type.availabilityRules.map((rule) => (
            <li key={rule.id} className="flex items-center justify-between">
              <span>
                {WEEKDAYS[rule.weekday]}: {rule.startTime}–{rule.endTime}
              </span>
              <button onClick={() => removeRule(rule.id)} className="text-xs text-red-600 hover:underline">
                Remove
              </button>
            </li>
          ))}
          {type.availabilityRules.length === 0 && (
            <li className="text-gray-400">No weekly hours set yet.</li>
          )}
        </ul>
        <div className="flex flex-wrap items-end gap-2">
          <select value={weekday} onChange={(e) => setWeekday(e.target.value)} className="input w-36">
            {WEEKDAYS.map((day, i) => (
              <option key={day} value={i}>{day}</option>
            ))}
          </select>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input w-28" />
          <span className="text-sm text-gray-400">to</span>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input w-28" />
          <button onClick={addRule} className="btn-secondary">Add</button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Blocked dates (days off)</p>
        <ul className="mb-3 space-y-1 text-sm">
          {type.availabilityOverrides.filter((o) => o.isBlocked).map((o) => (
            <li key={o.id} className="flex items-center justify-between">
              <span>{o.date}</span>
              <button onClick={() => removeOverride(o.id)} className="text-xs text-red-600 hover:underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-end gap-2">
          <input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} className="input w-44" />
          <button onClick={blockDay} className="btn-secondary">Block this day</button>
        </div>
      </div>
    </div>
  );
}
