import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminRequest } from "@/lib/adminGuard";
import { listContacts, createContact } from "@/lib/crm/contacts";

export async function GET(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const search = req.nextUrl.searchParams.get("search") ?? undefined;
  const contacts = await listContacts(search);
  return NextResponse.json({ contacts });
}

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid contact", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const contact = await createContact(parsed.data);
    return NextResponse.json({ contact }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "A contact with that email already exists" }, { status: 409 });
    }
    console.error("[contacts] Failed to create:", error);
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}
