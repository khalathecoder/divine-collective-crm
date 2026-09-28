import { parseCsv } from "../csv";
import { upsertContact } from "./contacts";
import { getProgramBySlug } from "./programs";
import { recordPurchase } from "./purchases";

/**
 * Matches the website's "Export orders as CSV" admin feature once it carries
 * customer identity (server/routers/payments.ts, being updated on the Manus
 * side as of Sept 2026 to include name/email/phone and Stripe ids so these
 * orders — Called & Crowned, digital guides — can finally be attributed to a
 * contact). If Manus changes this column set, update EXPECTED_HEADER to match
 * rather than guessing at a looser parse.
 */
const EXPECTED_HEADER = [
  "Order ID",
  "Customer Name",
  "Customer Email",
  "Customer Phone",
  "Product",
  "Amount",
  "Currency",
  "Status",
  "Stripe Checkout Session ID",
  "Stripe Payment Intent ID",
  "Date",
];

/**
 * The CSV has human product names, not slugs, and they don't always match a
 * Program's exact name (e.g. "B.O.L.D. OUT Masterclass" here vs. "B.O.L.D.
 * OUT Voice Activation Experience™" as the Program name). Normalize both
 * sides and map explicitly rather than guessing with fuzzy matching.
 */
const PRODUCT_NAME_TO_SLUG: Record<string, string> = {
  "b.o.l.d. out masterclass": "bold-out-masterclass",
  "b.o.l.d. out voice activation experience": "bold-out-masterclass",
  "the crown hour": "crown-hour",
  "crown hour": "crown-hour",
  "v.o.i.c.e. activated": "voice-activate",
  "voice activated": "voice-activate",
  "called & crowned (6-week)": "called-crowned-6week",
  "called & crowned (3-month)": "called-crowned-3month",
  "called & crowned (6-month)": "called-crowned-6month",
  "the divine mindset guide": "divine-mindset-guide",
  "divine mindset guide": "divine-mindset-guide",
  "you have something to say...use your voice": "you-have-something-to-say-book",
};

function normalizeProductName(name: string): string {
  return name.trim().toLowerCase().replace(/[™®]/g, "").replace(/\s+/g, " ");
}

export interface ImportOrdersResult {
  totalRows: number;
  succeededRows: number;
  purchasesRecorded: number;
  skippedNoEmail: number;
  skippedNotSucceeded: number;
  unmatchedProducts: string[];
}

export async function importOrdersCsv(csvText: string): Promise<ImportOrdersResult> {
  const rows = parseCsv(csvText);
  if (rows.length === 0) throw new Error("The file is empty.");

  const header = rows[0]!.map((h) => h.trim());
  const matches = EXPECTED_HEADER.every((col, i) => header[i]?.toLowerCase() === col.toLowerCase());
  if (!matches) {
    throw new Error(
      `Unrecognized CSV format. Expected columns: ${EXPECTED_HEADER.join(", ")}. ` +
        `Export this from the website's admin page ("Export orders as CSV").`
    );
  }

  const dataRows = rows.slice(1);
  let succeededRows = 0;
  let purchasesRecorded = 0;
  let skippedNoEmail = 0;
  let skippedNotSucceeded = 0;
  const unmatchedProducts = new Set<string>();

  for (const row of dataRows) {
    const [, nameRaw, emailRaw, phoneRaw, product, amountRaw, currency, status, checkoutSessionId, paymentIntentId, dateRaw] =
      row;

    if ((status ?? "").trim().toLowerCase() !== "succeeded") {
      skippedNotSucceeded += 1;
      continue;
    }
    succeededRows += 1;

    const email = (emailRaw ?? "").trim().toLowerCase();
    if (!email) {
      skippedNoEmail += 1;
      continue;
    }

    const slug = PRODUCT_NAME_TO_SLUG[normalizeProductName(product ?? "")];
    const program = slug ? await getProgramBySlug(slug) : undefined;
    if (!program) {
      unmatchedProducts.add(product ?? "(blank)");
      continue;
    }

    const contact = await upsertContact({
      name: nameRaw?.trim() || email,
      email,
      phone: phoneRaw?.trim() || undefined,
      source: "manus-import:order",
    });

    const amountPaidCents = Math.round(parseFloat(amountRaw ?? "0") * 100);
    const purchasedAtDate = dateRaw ? new Date(dateRaw) : undefined;
    const purchasedAt = purchasedAtDate && !Number.isNaN(purchasedAtDate.getTime()) ? purchasedAtDate : undefined;
    const externalId = paymentIntentId?.trim() || checkoutSessionId?.trim() || undefined;

    const { created } = await recordPurchase({
      contactId: contact.id,
      programId: program.id,
      amountPaidCents,
      currency: currency?.trim() || "usd",
      externalId,
      source: "manus-import",
      purchasedAt,
    });
    if (created) purchasesRecorded += 1;
  }

  return {
    totalRows: dataRows.length,
    succeededRows,
    purchasesRecorded,
    skippedNoEmail,
    skippedNotSucceeded,
    unmatchedProducts: Array.from(unmatchedProducts),
  };
}
