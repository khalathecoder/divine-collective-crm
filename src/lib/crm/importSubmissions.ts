import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { contactEvents } from "../db/schema";
import { parseCsv } from "../csv";
import { upsertContact, logContactEvent } from "./contacts";
import { getProgramBySlug } from "./programs";
import { recordPurchase } from "./purchases";

/**
 * Matches the exact column order of the website's own "Export all submissions
 * as CSV" admin feature (server/routers/admin.ts, exportSubmissionsAsCSV).
 * Safe to run repeatedly with a newer export: existing contacts are only
 * ever filled in or tagged further (never overwritten), rows already seen
 * before (by their original submission ID) don't get a second activity-log
 * entry, and a purchase already on file is never duplicated or re-counted.
 */
const EXPECTED_HEADER = [
  "ID",
  "Name",
  "Email",
  "Phone",
  "Type",
  "Message",
  "Read",
  "Created At",
  "Tier",
  "GHL Tag",
  "Metadata",
];

const TYPE_LABELS: Record<string, string> = {
  contact: "Contact form",
  survey: "Survey",
  assessment: "Assessment",
  lead_magnet: "Lead magnet",
  waitlist: "Waitlist signup",
  bold_out: "B.O.L.D. OUT",
  voice_activate: "V.O.I.C.E. Activated",
  crown_hour: "Crown Hour",
  she_found_her_voice_event: "She Found Her Voice event",
};

/**
 * Only these submission types carry a real paid registration with an
 * amount in their metadata (see stripeWebhook.ts on the website). Generic
 * orders (Called & Crowned, digital guides) live only in the website's
 * `orders` table, whose own CSV export has no buyer email — there's no
 * reliable way to attribute those to a contact from an export alone.
 */
const TYPE_TO_PROGRAM_SLUG: Record<string, string> = {
  bold_out: "bold-out-masterclass",
  crown_hour: "crown-hour",
  voice_activate: "voice-activate",
};

export interface ImportSubmissionsResult {
  totalRows: number;
  processed: number;
  newActivity: number;
  alreadyImported: number;
  skippedNoEmail: number;
  purchasesRecorded: number;
}

export async function importSubmissionsCsv(csvText: string): Promise<ImportSubmissionsResult> {
  const rows = parseCsv(csvText);
  if (rows.length === 0) throw new Error("The file is empty.");

  const header = rows[0]!.map((h) => h.trim());
  const matches = EXPECTED_HEADER.every((col, i) => header[i]?.toLowerCase() === col.toLowerCase());
  if (!matches) {
    throw new Error(
      `Unrecognized CSV format. Expected columns: ${EXPECTED_HEADER.join(", ")}. ` +
        `Export this from the website's admin page ("Export all submissions as CSV").`
    );
  }

  const dataRows = rows.slice(1);
  let processed = 0;
  let newActivity = 0;
  let alreadyImportedCount = 0;
  let skippedNoEmail = 0;
  let purchasesRecorded = 0;

  for (const row of dataRows) {
    const [id, name, emailRaw, phoneRaw, type, message, , createdAtRaw, , ghlTag, metadataRaw] = row;
    const email = (emailRaw ?? "").trim().toLowerCase();

    if (!email) {
      skippedNoEmail += 1;
      continue;
    }

    const phone = phoneRaw ? phoneRaw.replace(/^'/, "").trim() || undefined : undefined;
    const tags = [type, ghlTag].map((t) => (t ?? "").trim()).filter(Boolean);
    const createdAt = createdAtRaw ? new Date(createdAtRaw) : undefined;
    const validCreatedAt = createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : undefined;

    const contact = await upsertContact({
      name: name?.trim() || email,
      email,
      phone,
      source: `manus-import:${type || "unknown"}`,
      addTags: tags,
    });

    const label = TYPE_LABELS[type ?? ""] ?? type ?? "Website submission";
    const trimmedMessage = message?.trim();

    // Skip if this exact submission (by its original row ID) was already
    // imported before — re-running with a newer export should only add rows
    // that weren't there last time, never duplicate ones that were.
    const alreadyImported = id
      ? await db.query.contactEvents.findFirst({
          where: and(eq(contactEvents.contactId, contact.id), sql`${contactEvents.payload}->>'originalId' = ${id}`),
        })
      : undefined;

    if (!alreadyImported) {
      await logContactEvent(
        contact.id,
        `import.${type || "unknown"}`,
        trimmedMessage ? `${label}: ${trimmedMessage.slice(0, 140)}` : label,
        { originalId: id, source: "manus-admin-export" },
        validCreatedAt
      );
      newActivity += 1;
    } else {
      alreadyImportedCount += 1;
    }

    const programSlug = type ? TYPE_TO_PROGRAM_SLUG[type] : undefined;
    if (programSlug) {
      const metadata = parseMetadata(metadataRaw);
      const amountPaidCents = typeof metadata?.amount_paid === "number" ? metadata.amount_paid : undefined;
      if (amountPaidCents !== undefined) {
        const program = await getProgramBySlug(programSlug);
        if (program) {
          const externalId =
            (typeof metadata?.payment_intent_id === "string" && metadata.payment_intent_id) ||
            (typeof metadata?.checkout_session_id === "string" && metadata.checkout_session_id) ||
            undefined;
          const { created } = await recordPurchase({
            contactId: contact.id,
            programId: program.id,
            amountPaidCents,
            externalId,
            source: "manus-import",
            purchasedAt: validCreatedAt,
          });
          if (created) purchasesRecorded += 1;
        }
      }
    }

    processed += 1;
  }

  return {
    totalRows: dataRows.length,
    processed,
    newActivity,
    alreadyImported: alreadyImportedCount,
    skippedNoEmail,
    purchasesRecorded,
  };
}

function parseMetadata(raw: string | undefined): Record<string, unknown> | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
