import { NextRequest, NextResponse } from "next/server";
import { guardAdminRequest } from "@/lib/adminGuard";
import { listContacts } from "@/lib/crm/contacts";

export async function GET(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const search = req.nextUrl.searchParams.get("search") ?? undefined;
  const contacts = await listContacts(search);
  return NextResponse.json({ contacts });
}
