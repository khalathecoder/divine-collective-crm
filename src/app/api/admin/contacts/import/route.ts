import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminRequest } from "@/lib/adminGuard";
import { importSubmissionsCsv } from "@/lib/crm/importSubmissions";

const schema = z.object({ csv: z.string().min(1) });

export async function POST(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing CSV content" }, { status: 400 });
  }

  try {
    const result = await importSubmissionsCsv(parsed.data.csv);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Import failed" }, { status: 400 });
  }
}
