import { and, eq, lte } from "drizzle-orm";
import { db } from "../db";
import { funnelEnrollments, funnelSteps, funnelSends, contacts } from "../db/schema";
import { sendEmail } from "../email";
import { logContactEvent, ensureUnsubscribeToken } from "./contacts";

/**
 * Finds every funnel enrollment whose next email is due, sends it, and
 * schedules (or completes) the next one. Safe to call repeatedly — it never
 * sends the same step twice for the same enrollment.
 */
export async function processDueFunnelSends(now: Date = new Date()): Promise<number> {
  const due = await db.query.funnelEnrollments.findMany({
    where: and(eq(funnelEnrollments.status, "active"), lte(funnelEnrollments.nextSendAt, now)),
    with: { contact: true, funnel: { with: { steps: true } } },
  });

  let sentCount = 0;

  for (const enrollment of due) {
    // Belt-and-suspenders: unsubscribing already cancels active enrollments,
    // but never send to someone marked unsubscribed no matter how they got
    // here — cancel the enrollment outright instead of just skipping it.
    if (enrollment.contact.unsubscribedAt) {
      await db.update(funnelEnrollments).set({ status: "canceled" }).where(eq(funnelEnrollments.id, enrollment.id));
      continue;
    }

    const orderedSteps = [...enrollment.funnel.steps].sort((a, b) => a.stepOrder - b.stepOrder);
    const step = orderedSteps[enrollment.currentStep];
    if (!step) {
      await db
        .update(funnelEnrollments)
        .set({ status: "completed" })
        .where(eq(funnelEnrollments.id, enrollment.id));
      continue;
    }

    const alreadySent = await db.query.funnelSends.findFirst({
      where: and(eq(funnelSends.enrollmentId, enrollment.id), eq(funnelSends.stepId, step.id)),
    });

    let delivered = Boolean(alreadySent);
    if (!alreadySent) {
      delivered = await sendFunnelStepEmail(enrollment.contact, step);
      if (delivered) {
        await db.insert(funnelSends).values({ enrollmentId: enrollment.id, stepId: step.id });
        await logContactEvent(
          enrollment.contact.id,
          "funnel.email_sent",
          `Received "${step.subject}" (step ${enrollment.currentStep + 1} of ${orderedSteps.length})`,
          { funnelId: enrollment.funnelId, stepId: step.id }
        );
        sentCount += 1;
      }
    }

    // If sending failed, leave the enrollment where it is — it will retry on
    // the next scheduler pass instead of silently skipping the step.
    if (!delivered) continue;

    const nextStep = orderedSteps[enrollment.currentStep + 1];
    if (nextStep) {
      await db
        .update(funnelEnrollments)
        .set({
          currentStep: enrollment.currentStep + 1,
          nextSendAt: new Date(Date.now() + nextStep.delayHours * 60 * 60 * 1000),
        })
        .where(eq(funnelEnrollments.id, enrollment.id));
    } else {
      await db
        .update(funnelEnrollments)
        .set({ status: "completed", currentStep: enrollment.currentStep + 1 })
        .where(eq(funnelEnrollments.id, enrollment.id));
    }
  }

  return sentCount;
}

async function sendFunnelStepEmail(
  contact: typeof contacts.$inferSelect,
  step: typeof funnelSteps.$inferSelect
): Promise<boolean> {
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    console.error("[funnelEngine] APP_URL is not set — refusing to send a marketing email without a working unsubscribe link.");
    return false;
  }

  const token = await ensureUnsubscribeToken(contact);
  const unsubscribeUrl = `${appUrl.replace(/\/$/, "")}/unsubscribe/${token}`;

  const body = step.bodyHtml.replaceAll("{{first_name}}", contact.name.split(" ")[0] || contact.name);
  const html = `${body}<p style="margin-top:32px;font-size:12px;color:#9ca3af;">You're receiving this because you registered or purchased with Divine Collective. <a href="${unsubscribeUrl}" style="color:#9ca3af;">Unsubscribe</a></p>`;

  try {
    await sendEmail({ to: contact.email, subject: step.subject, html });
    return true;
  } catch (error) {
    console.error(`[funnelEngine] Failed to send step ${step.id} to ${contact.email}:`, error);
    return false;
  }
}
