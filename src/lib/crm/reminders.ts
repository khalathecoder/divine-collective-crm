import { and, eq, gte, isNull, lte } from "drizzle-orm";
import { toZonedTime, format } from "date-fns-tz";
import { db } from "../db";
import { appointments } from "../db/schema";
import { sendEmail } from "../email";

interface ReminderWindow {
  field: "reminder24hSentAt" | "reminder1hSentAt";
  hoursBefore: number;
  label: string;
}

const WINDOWS: ReminderWindow[] = [
  { field: "reminder24hSentAt", hoursBefore: 24, label: "tomorrow" },
  { field: "reminder1hSentAt", hoursBefore: 1, label: "in about an hour" },
];

/** Sends "your appointment is coming up" emails and marks them sent so they never repeat. */
export async function sendDueAppointmentReminders(now: Date = new Date()): Promise<number> {
  let sent = 0;

  for (const window of WINDOWS) {
    const targetTime = new Date(now.getTime() + window.hoursBefore * 60 * 60 * 1000);
    // A 10-minute lookahead window, matched against the scheduler's own run interval.
    const windowStart = new Date(targetTime.getTime() - 5 * 60 * 1000);
    const windowEnd = new Date(targetTime.getTime() + 5 * 60 * 1000);

    const due = await db.query.appointments.findMany({
      where: and(
        eq(appointments.status, "confirmed"),
        gte(appointments.startAt, windowStart),
        lte(appointments.startAt, windowEnd),
        isNull(appointments[window.field])
      ),
      with: { contact: true, appointmentType: true },
    });

    for (const appt of due) {
      const friendlyTime = format(
        toZonedTime(appt.startAt, appt.appointmentType.timezone),
        "EEEE, MMMM d 'at' h:mm a zzz",
        { timeZone: appt.appointmentType.timezone }
      );
      try {
        await sendEmail({
          to: appt.contact.email,
          subject: `Reminder: ${appt.appointmentType.name} ${window.label}`,
          html: `<p>Hi ${appt.contact.name},</p><p>Just a reminder — your <strong>${appt.appointmentType.name}</strong> is ${window.label}, on ${friendlyTime}.</p>`,
        });
        await db
          .update(appointments)
          .set({ [window.field]: new Date() })
          .where(eq(appointments.id, appt.id));
        sent += 1;
      } catch (error) {
        console.error(`[reminders] Failed to send ${window.field} reminder for appointment ${appt.id}:`, error);
      }
    }
  }

  return sent;
}
