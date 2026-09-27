import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminRequest } from "@/lib/adminGuard";
import { generateApiKey, hashApiKey } from "@/lib/apiAuth";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;
  const keys = await db
    .select({ id: apiKeys.id, name: apiKeys.name, createdAt: apiKeys.createdAt, lastUsedAt: apiKeys.lastUsedAt })
    .from(apiKeys);
  return NextResponse.json({ apiKeys: keys });
}

const schema = z.object({ name: z.string().min(1) });

/** Creates a new key and returns the raw value exactly once — it is never shown again. */
export async function POST(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const rawKey = generateApiKey();
  const [created] = await db
    .insert(apiKeys)
    .values({ name: parsed.data.name, keyHash: hashApiKey(rawKey) })
    .returning();

  return NextResponse.json({ apiKey: created, rawKey }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.delete(apiKeys).where(eq(apiKeys.id, id));
  return NextResponse.json({ ok: true });
}
