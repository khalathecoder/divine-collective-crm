import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { guardAdminRequest } from "@/lib/adminGuard";
import { db } from "@/lib/db";
import { appointmentTypes } from "@/lib/db/schema";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const id = Number(params.id);
  const existing = await db.query.appointmentTypes.findFirst({ where: eq(appointmentTypes.id, id) });
  if (!existing) return NextResponse.json({ error: "Calendar not found" }, { status: 404 });

  try {
    await db.delete(appointmentTypes).where(eq(appointmentTypes.id, id));
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    // appointments.appointmentTypeId is ON DELETE RESTRICT, so this fails if
    // anyone has ever booked a (even past/canceled) appointment on it.
    if (error?.code === "23503") {
      return NextResponse.json(
        { error: "This calendar has booked appointments on it and can't be deleted." },
        { status: 409 }
      );
    }
    console.error("[appointment-types/delete] Failed:", error);
    return NextResponse.json({ error: "Failed to delete calendar" }, { status: 500 });
  }
}
