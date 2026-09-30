import { and, eq, gte, lt } from "drizzle-orm";
import { fromZonedTime, toZonedTime, format } from "date-fns-tz";
import { db } from "../db";
import {
  appointmentTypes,
  availabilityRules,
  availabilityOverrides,
  appointments,
  type AppointmentType,
} from "../db/schema";
import { upsertContact, logContactEvent } from "./contacts";
import { sendEmail } from "../email";

export async function listAppointmentTypes(): Promise<AppointmentType[]> {
  return db.query.appointmentTypes.findMany({ where: eq(appointmentTypes.active, true) });
}

export async function getAppointmentTypeBySlug(slug: string) {
  return db.query.appointmentTypes.findFirst({ where: eq(appointmentTypes.slug, slug) });
}

export async function getAppointmentTypeByProgramId(programId: number) {
  return db.query.appointmentTypes.findFirst({
    where: eq(appointmentTypes.programId, programId),
    with: { availabilityRules: true, availabilityOverrides: true },
  });
}

/**
 * Creates a dedicated calendar for one program, named and slugged after it.
 * Its slots are independent of every other calendar — a booking here never
 * blocks or is blocked by bookings on another program's calendar.
 */
export async function createCalendarForProgram(
  programId: number,
  programName: string,
  programSlug: string,
  options?: { durationMinutes?: number; bufferMinutes?: number }
): Promise<AppointmentType> {
  const [created] = await db
    .insert(appointmentTypes)
    .values({
      slug: programSlug,
      name: programName,
      durationMinutes: options?.durationMinutes ?? 30,
      bufferMinutes: options?.bufferMinutes ?? 15,
      timezone: "America/New_York",
      programId,
    })
    .returning();
  if (!created) throw new Error("Failed to create calendar");
  return created;
}

export interface TimeSlot {
  start: Date;
  end: Date;
}

/**
 * Builds the list of bookable slots for one calendar day (given as
 * "YYYY-MM-DD", meaning that date in the appointment type's own timezone —
 * not the visitor's browser timezone), from the weekly availability rules,
 * any one-off overrides for that date, and appointments already on the books.
 */
export async function getAvailableSlots(appointmentTypeId: number, dateStr: string): Promise<TimeSlot[]> {
  const type = await db.query.appointmentTypes.findFirst({ where: eq(appointmentTypes.id, appointmentTypeId) });
  if (!type) return [];

  const weekday = toZonedTime(fromZonedTime(`${dateStr}T12:00:00`, type.timezone), type.timezone).getDay();
  const dayStart = fromZonedTime(`${dateStr}T00:00:00`, type.timezone);
  const dayEnd = fromZonedTime(`${dateStr}T23:59:59.999`, type.timezone);

  const [rules, overrides, existing] = await Promise.all([
    db.query.availabilityRules.findMany({
      where: and(eq(availabilityRules.appointmentTypeId, appointmentTypeId), eq(availabilityRules.weekday, weekday)),
    }),
    db.query.availabilityOverrides.findMany({
      where: and(eq(availabilityOverrides.appointmentTypeId, appointmentTypeId), eq(availabilityOverrides.date, dateStr)),
    }),
    db.query.appointments.findMany({
      where: and(
        eq(appointments.appointmentTypeId, appointmentTypeId),
        eq(appointments.status, "confirmed"),
        gte(appointments.startAt, dayStart),
        lt(appointments.startAt, dayEnd)
      ),
    }),
  ]);

  const fullDayBlocked = overrides.some((o) => o.isBlocked && !o.startTime);
  if (fullDayBlocked) return [];

  // Postgres returns `time` columns as "HH:MM:SS" regardless of how they were
  // inserted; normalize to "HH:MM" before appending our own ":00" so this
  // works whether the value came from the DB or from a raw "HH:MM" input.
  const combine = (time: string) => fromZonedTime(`${dateStr}T${time.slice(0, 5)}:00`, type.timezone);

  const windows: TimeSlot[] = [];
  for (const rule of rules) {
    windows.push({ start: combine(rule.startTime), end: combine(rule.endTime) });
  }
  for (const override of overrides) {
    if (!override.isBlocked && override.startTime && override.endTime) {
      windows.push({ start: combine(override.startTime), end: combine(override.endTime) });
    }
  }

  const blockedWindows = overrides
    .filter((o) => o.isBlocked && o.startTime && o.endTime)
    .map((o) => ({ start: combine(o.startTime as string), end: combine(o.endTime as string) }));

  const stepMs = (type.durationMinutes + type.bufferMinutes) * 60 * 1000;
  const slots: TimeSlot[] = [];
  for (const window of windows) {
    for (
      let start = window.start.getTime();
      start + type.durationMinutes * 60 * 1000 <= window.end.getTime();
      start += stepMs
    ) {
      const slotStart = new Date(start);
      const slotEnd = new Date(start + type.durationMinutes * 60 * 1000);
      if (slotStart <= new Date()) continue;

      const overlapsExisting = existing.some((appt) => slotStart < appt.endAt && slotEnd > appt.startAt);
      const overlapsBlocked = blockedWindows.some((b) => slotStart < b.end && slotEnd > b.start);
      if (!overlapsExisting && !overlapsBlocked) {
        slots.push({ start: slotStart, end: slotEnd });
      }
    }
  }
  return slots;
}

export interface BookAppointmentInput {
  appointmentTypeId: number;
  start: Date;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}

export async function bookAppointment(input: BookAppointmentInput) {
  const type = await db.query.appointmentTypes.findFirst({ where: eq(appointmentTypes.id, input.appointmentTypeId) });
  if (!type) throw new Error("Appointment type not found");

  const contact = await upsertContact({
    name: input.name,
    email: input.email,
    phone: input.phone,
    source: "website:booking",
    addTags: [`booked-${type.slug}`],
  });

  const end = new Date(input.start.getTime() + type.durationMinutes * 60 * 1000);
  const [appointment] = await db
    .insert(appointments)
    .values({
      contactId: contact.id,
      appointmentTypeId: type.id,
      startAt: input.start,
      endAt: end,
      notes: input.notes,
    })
    .returning();
  if (!appointment) throw new Error("Failed to create appointment");

  await logContactEvent(contact.id, "appointment.booked", `Booked ${type.name}`, {
    appointmentId: appointment.id,
    startAt: input.start.toISOString(),
  });

  const friendlyTime = format(toZonedTime(input.start, type.timezone), "EEEE, MMMM d 'at' h:mm a zzz", {
    timeZone: type.timezone,
  });

  await sendEmail({
    to: contact.email,
    subject: `Confirmed: ${type.name}`,
    html: `<p>Hi ${contact.name},</p><p>Your <strong>${type.name}</strong> is confirmed for ${friendlyTime}.</p><p>We'll send you a reminder before it starts.</p>`,
  }).catch((error) => console.error("[booking] confirmation email failed:", error));

  return appointment;
}
