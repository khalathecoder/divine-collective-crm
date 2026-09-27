import { NextRequest, NextResponse } from "next/server";
import { guardAdminRequest } from "@/lib/adminGuard";
import { getContactWithHistory } from "@/lib/crm/contacts";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const result = await getContactWithHistory(Number(params.id));
  if (!result) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  return NextResponse.json(result);
}
