import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminRequest } from "@/lib/adminGuard";
import { getContactWithHistory, updateContact, deleteContact } from "@/lib/crm/contacts";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const result = await getContactWithHistory(Number(params.id));
  if (!result) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  return NextResponse.json(result);
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const contact = await updateContact(Number(params.id), parsed.data);
    return NextResponse.json({ contact });
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Another contact already uses that email" }, { status: 409 });
    }
    console.error("[contacts] Failed to update:", error);
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  await deleteContact(Number(params.id));
  return NextResponse.json({ ok: true });
}
