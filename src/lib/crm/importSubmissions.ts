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

/** ID, Name, Email, Phone, Type, Message, Read, Created At — always at these fixed positions. */
const FRONT_COUNT = 8;

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
 * `orders` table; import those separately via importOrders.ts.
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
  phoneOnlyPlaceholders: number;
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
  let phoneOnlyPlaceholders = 0;

  for (const row of dataRows) {
    const { id, name, emailRaw, phoneRaw, type, message, createdAtRaw, tier, ghlTagCombined, metadataRaw } =
      parseRow(row);
    const phone = phoneRaw ? phoneRaw.replace(/^'/, "").trim() || undefined : undefined;

    // The Contacts table requires an email, so a phone-only row (blank
    // Email, real Phone) gets an internal placeholder synthesized from its
    // phone number — this never touches the CSV, it only exists in the CRM
    // so the row isn't lost. Some older exports instead embed the phone
    // directly in a fake "phone-<number>@sfhv.local" email; that's honored
    // the same way. Either way the contact is tagged so nobody emails it.
    const rawEmail = emailRaw.trim().toLowerCase();
    const alreadyFakeEmail = /@sfhv\.local$/i.test(rawEmail);
    let email = rawEmail;
    let isPlaceholderEmail = alreadyFakeEmail;
    if (!email && phone) {
      const digits = phone.replace(/\D/g, "");
      email = `phone-${digits || id || "unknown"}@placeholder.local`;
      isPlaceholderEmail = true;
    }

    if (!email) {
      skippedNoEmail += 1;
      continue;
    }
    if (isPlaceholderEmail) phoneOnlyPlaceholders += 1;

    const ghlTags = ghlTagCombined.split(",").map((t) => t.trim()).filter(Boolean);
    const tags = [type, ...ghlTags, isPlaceholderEmail ? "no-real-email" : undefined]
      .map((t) => (t ?? "").trim())
      .filter(Boolean);

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
        { originalId: id, tier, source: "manus-admin-export" },
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
    phoneOnlyPlaceholders,
  };
}

interface ParsedRow {
  id: string;
  name: string;
  emailRaw: string;
  phoneRaw: string;
  type: string;
  message: string;
  createdAtRaw: string;
  tier: string;
  ghlTagCombined: string;
  metadataRaw: string;
}

/**
 * The front 8 columns (ID..Created At) are always at fixed positions. The
 * back 3 (Tier, GHL Tag, Metadata) aren't reliable by position: this export
 * doesn't quote GHL Tag even when it holds a comma-separated value like
 * "VOICEACTIVATE,VA1026", so that single logical field splits across extra
 * raw columns. Reconstruct it by taking the first back-field as Tier, the
 * last as Metadata (always last, and reliably quoted when it's JSON), and
 * joining everything in between back into one comma-separated tag string —
 * which also naturally undoes the split. A stray trailing empty column some
 * rows carry is stripped first so it doesn't get mistaken for Metadata.
 */
function parseRow(row: string[]): ParsedRow {
  const [id, name, emailRaw, phoneRaw, type, message, , createdAtRaw] = row;
  const back = row.slice(FRONT_COUNT);
  while (back.length > 3 && back[back.length - 1] === "") back.pop();

  return {
    id: id ?? "",
    name: name ?? "",
    emailRaw: emailRaw ?? "",
    phoneRaw: phoneRaw ?? "",
    type: type ?? "",
    message: message ?? "",
    createdAtRaw: createdAtRaw ?? "",
    tier: back[0] ?? "",
    ghlTagCombined: back.slice(1, -1).join(","),
    metadataRaw: back[back.length - 1] ?? "",
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
