import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "./apiAuth";

/** Returns a 401 response if the request isn't from a logged-in session or a valid API key, otherwise null. */
export async function guardAdminRequest(req: NextRequest): Promise<NextResponse | null> {
  const ok = await requireAdminAccess(req);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}
