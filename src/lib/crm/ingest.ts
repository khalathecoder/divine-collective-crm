import { db } from "../db";
import { purchases } from "../db/schema";
import type { WebsiteWebhookPayload } from "../validation";
import { upsertContact, logContactEvent } from "./contacts";
import { getProgramBySlug } from "./programs";
import { enrollContactInMatchingFunnels } from "./funnels";

/**
 * Single entry point for everything the dicollectivellc.com website reports:
 * a new lead, a program registration, a completed purchase, or a survey
 * submitted through the website itself. This is what replaces the old
 * GoHighLevel sync.
 */
export async function ingestWebsiteEvent(payload: WebsiteWebhookPayload): Promise<{ contactId: number }> {
  const contact = await upsertContact({
    name: payload.contact.name,
    email: payload.contact.email,
    phone: payload.contact.phone,
    source: payload.source,
    addTags: payload.tags,
  });

  switch (payload.type) {
    case "contact.captured": {
      await logContactEvent(contact.id, "contact.captured", `Submitted a form (${payload.source ?? "website"})`, {
        source: payload.source,
      });
      break;
    }

    case "registration.created": {
      const program = payload.programSlug ? await getProgramBySlug(payload.programSlug) : undefined;
      await logContactEvent(
        contact.id,
        "registration.created",
        program ? `Registered for ${program.name}` : "Registered for a program",
        { programSlug: payload.programSlug }
      );
      await enrollContactInMatchingFunnels(contact.id, "registration.created", program?.id);
      break;
    }

    case "purchase.completed": {
      const program = payload.programSlug ? await getProgramBySlug(payload.programSlug) : undefined;
      if (program) {
        await db.insert(purchases).values({
          contactId: contact.id,
          programId: program.id,
          amountPaidCents: payload.amountCents ?? program.priceCents,
          currency: payload.currency ?? program.currency,
          paymentPlanId: payload.paymentPlanId,
          externalId: payload.externalId,
          source: "website",
        });
      }
      await logContactEvent(
        contact.id,
        "purchase.completed",
        program ? `Purchased ${program.name}` : "Completed a purchase",
        { programSlug: payload.programSlug, amountCents: payload.amountCents, externalId: payload.externalId }
      );
      await enrollContactInMatchingFunnels(contact.id, "purchase.completed", program?.id);
      break;
    }

    case "survey.submitted": {
      await logContactEvent(contact.id, "survey.submitted", "Submitted a survey on the website", {
        surveySlug: payload.surveySlug,
        answers: payload.surveyAnswers,
      });
      break;
    }
  }

  return { contactId: contact.id };
}
