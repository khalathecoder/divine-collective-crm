import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

/**
 * What the dicollectivellc.com website sends to POST /api/webhooks/website.
 * `type` decides what happens; `programSlug` links a purchase/registration to
 * one of this CRM's programs (create the program here first with a matching
 * slug, e.g. "bold-out-masterclass").
 */
export const websiteWebhookSchema = z.object({
  type: z.enum([
    "contact.captured",
    "registration.created",
    "purchase.completed",
    "survey.submitted",
  ]),
  contact: contactSchema,
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  programSlug: z.string().optional(),
  amountCents: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  paymentPlanId: z.string().optional(),
  externalId: z.string().optional(),
  note: z.string().optional(),
  surveyAnswers: z.record(z.string()).optional(),
  surveySlug: z.string().optional(),
});

export type WebsiteWebhookPayload = z.infer<typeof websiteWebhookSchema>;
