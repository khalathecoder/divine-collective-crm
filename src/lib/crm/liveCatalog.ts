import { createProgram, getProgramBySlug } from "./programs";
import type { InsertProgram } from "../db/schema";

/**
 * Nancy's real, currently-sold programs, pulled from the dicollectivellc.com
 * website's own product/pricing code (server/products.ts and
 * shared/{crownHour,voiceActivate}.ts) as of Sept 2026. This is a manual
 * snapshot, not a live sync — if a price or program changes on the website,
 * update it here (or just edit the Program directly in this CRM) and click
 * "Import live programs" again; it only fills in what's missing.
 */
const LIVE_CATALOG: InsertProgram[] = [
  {
    slug: "bold-out-masterclass",
    name: "B.O.L.D. OUT Voice Activation Experience™",
    description:
      "A 90-minute virtual, faith-rooted voice activation experience with practical exercises, the B.O.L.D. Voice Framework™, seven Bold Declarations, and live Q&A with Nancy Marie Dixon.",
    priceCents: 4700,
    type: "event",
  },
  {
    slug: "crown-hour",
    name: "The Crown Hour",
    description:
      "A powerful first step for women who need clarity, language, and direction before they make another move.",
    priceCents: 9700,
    type: "coaching",
  },
  {
    slug: "voice-activate",
    name: "V.O.I.C.E. Activated",
    description:
      "A group activation journey for women ready to practice speaking, showing up, and moving in alignment with their calling.",
    priceCents: 49700,
    type: "event",
  },
  {
    slug: "called-crowned-6week",
    name: "Called & Crowned (6-Week)",
    description:
      "An intimate private coaching journey for women ready to activate their voice and step into their sacred self-worth over six weeks.",
    priceCents: 149700,
    type: "coaching",
  },
  {
    slug: "called-crowned-3month",
    name: "Called & Crowned (3-Month)",
    description:
      "An extended private coaching journey for women ready to go deeper in their voice activation and self-worth transformation over a full quarter.",
    priceCents: 249700,
    type: "coaching",
  },
  {
    slug: "called-crowned-6month",
    name: "Called & Crowned (6-Month)",
    description:
      "Nancy's most comprehensive private coaching experience for women committed to complete transformation and sustained voice activation over six months.",
    priceCents: 349700,
    type: "coaching",
  },
  {
    slug: "divine-mindset-guide",
    name: "The Divine Mindset Guide",
    description:
      "A companion guide exploring the relationship between your mindset and your voice, with practical reflections and declarations.",
    priceCents: 999,
    type: "digital",
  },
  {
    slug: "you-have-something-to-say-book",
    name: "You Have Something to Say...Use Your Voice",
    description:
      "A transformational guide for women reclaiming their voice and presence, exploring the connection between mindset, self-worth, and authentic expression.",
    priceCents: 1999,
    type: "digital",
  },
];

export interface ImportResult {
  created: string[];
  skipped: string[];
}

/** Creates any of the live catalog's programs that don't already exist (matched by slug). */
export async function importLiveCatalog(): Promise<ImportResult> {
  const created: string[] = [];
  const skipped: string[] = [];

  for (const program of LIVE_CATALOG) {
    const existing = await getProgramBySlug(program.slug);
    if (existing) {
      skipped.push(program.name);
      continue;
    }
    await createProgram(program);
    created.push(program.name);
  }

  return { created, skipped };
}
