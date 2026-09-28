import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { purchases, type Purchase } from "../db/schema";

export interface RecordPurchaseInput {
  contactId: number;
  programId: number;
  amountPaidCents: number;
  currency?: string;
  paymentPlanId?: string;
  externalId?: string;
  source?: string;
  purchasedAt?: Date;
}

/**
 * Records a purchase, skipping if one already exists for the same person and
 * program — matched by externalId (Stripe payment/checkout id) when we have
 * one, or by contact + program when we don't (e.g. an older CSV export with
 * no payment id in its metadata). Either way, re-sending the same webhook
 * event or re-running the same import never double-counts revenue or adds a
 * second copy of the same purchase.
 */
export async function recordPurchase(input: RecordPurchaseInput): Promise<{ created: boolean; purchase?: Purchase }> {
  const existing = input.externalId
    ? await db.query.purchases.findFirst({
        where: and(eq(purchases.programId, input.programId), eq(purchases.externalId, input.externalId)),
      })
    : await db.query.purchases.findFirst({
        where: and(eq(purchases.programId, input.programId), eq(purchases.contactId, input.contactId)),
      });
  if (existing) return { created: false, purchase: existing };

  const [created] = await db
    .insert(purchases)
    .values({
      contactId: input.contactId,
      programId: input.programId,
      amountPaidCents: input.amountPaidCents,
      currency: input.currency ?? "usd",
      paymentPlanId: input.paymentPlanId,
      externalId: input.externalId,
      source: input.source ?? "website",
      ...(input.purchasedAt ? { purchasedAt: input.purchasedAt } : {}),
    })
    .returning();

  return { created: true, purchase: created };
}
