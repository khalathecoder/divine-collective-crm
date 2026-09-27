import cron from "node-cron";
import { processDueFunnelSends } from "./funnelEngine";
import { sendDueAppointmentReminders } from "./reminders";

let started = false;

/**
 * Runs every 5 minutes for as long as the app is up: sends any funnel emails
 * that have come due, and any appointment reminders. Railway keeps this
 * process running continuously, so a plain cron job inside the app is enough
 * — no separate worker service needed.
 */
export function startScheduler(): void {
  if (started) return;
  started = true;

  cron.schedule("*/5 * * * *", async () => {
    try {
      const sent = await processDueFunnelSends();
      if (sent > 0) console.log(`[scheduler] Sent ${sent} funnel email(s).`);
    } catch (error) {
      console.error("[scheduler] Funnel processing failed:", error);
    }

    try {
      const sent = await sendDueAppointmentReminders();
      if (sent > 0) console.log(`[scheduler] Sent ${sent} appointment reminder(s).`);
    } catch (error) {
      console.error("[scheduler] Reminder processing failed:", error);
    }
  });

  console.log("[scheduler] Started (funnel emails + appointment reminders every 5 minutes).");
}
