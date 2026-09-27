import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { apiKeys } from "./db/schema";
import { getSessionUserId } from "./auth";

/** Verifies the shared secret the dicollectivellc.com website sends on webhook calls. */
export function verifyWebsiteWebhookKey(req: NextRequest): boolean {
  const provided = req.headers.get("x-api-key");
  const expected = process.env.WEBSITE_WEBHOOK_API_KEY;
  if (!provided || !expected) return false;
  return timingSafeEqual(provided, expected);
}

/**
 * Admin API access: either a logged-in browser session, or an
 * `Authorization: Bearer <key>` header matching a key created in
 * Settings > API Keys (for scripts, or a Claude Code session acting on
 * Nancy's behalf).
 */
export async function requireAdminAccess(req: NextRequest): Promise<boolean> {
  const sessionUserId = await getSessionUserId();
  if (sessionUserId) return true;

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const key = auth.slice("Bearer ".length).trim();
  if (!key) return false;

  const keyHash = hashApiKey(key);
  // apiKeys table is small (a handful of rows), so a full scan is fine.
  const all = await db.select().from(apiKeys);
  const found = all.find((row) => row.keyHash === keyHash);
  if (!found) return false;

  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, found.id));
  return true;
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): string {
  return `dccrm_${crypto.randomBytes(24).toString("hex")}`;
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
