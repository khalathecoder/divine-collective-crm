import { NextRequest, NextResponse } from "next/server";
import { guardAdminRequest } from "@/lib/adminGuard";
import { importLiveCatalog } from "@/lib/crm/liveCatalog";

export async function POST(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const result = await importLiveCatalog();
  return NextResponse.json(result);
}
