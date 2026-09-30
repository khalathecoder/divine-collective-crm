import { NextRequest, NextResponse } from "next/server";
import { guardAdminRequest } from "@/lib/adminGuard";
import { getProgram } from "@/lib/crm/programs";
import { createCalendarForProgram, getAppointmentTypeByProgramId } from "@/lib/crm/booking";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const programId = Number(params.id);
  const program = await getProgram(programId);
  if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });

  const existing = await getAppointmentTypeByProgramId(programId);
  if (existing) return NextResponse.json({ error: "This program already has a calendar" }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const durationMinutes = Number(body?.durationMinutes);
  const bufferMinutes = Number(body?.bufferMinutes);

  try {
    const appointmentType = await createCalendarForProgram(programId, program.name, program.slug, {
      durationMinutes: Number.isFinite(durationMinutes) && durationMinutes > 0 ? durationMinutes : undefined,
      bufferMinutes: Number.isFinite(bufferMinutes) && bufferMinutes >= 0 ? bufferMinutes : undefined,
    });
    return NextResponse.json({ appointmentType }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: `An appointment type with the slug "${program.slug}" already exists. Rename it first.` },
        { status: 409 }
      );
    }
    console.error("[programs/calendar] Failed to create:", error);
    return NextResponse.json({ error: "Failed to create calendar" }, { status: 500 });
  }
}
