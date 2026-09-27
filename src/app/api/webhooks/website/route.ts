import { NextRequest, NextResponse } from "next/server";
import { verifyWebsiteWebhookKey } from "@/lib/apiAuth";
import { websiteWebhookSchema } from "@/lib/validation";
import { ingestWebsiteEvent } from "@/lib/crm/ingest";

export async function POST(req: NextRequest) {
  if (!verifyWebsiteWebhookKey(req)) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = websiteWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await ingestWebsiteEvent(parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[webhook] Failed to process event:", error);
    return NextResponse.json({ error: "Failed to process event" }, { status: 500 });
  }
}
