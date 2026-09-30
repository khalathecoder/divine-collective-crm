import { NextRequest, NextResponse } from "next/server";
import { guardAdminRequest } from "@/lib/adminGuard";
import { getProgram } from "@/lib/crm/programs";
import { createCalendarForProgram, attachProgramToCalendar } from "@/lib/crm/booking";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const programId = Number(params.id);
  const program = await getProgram(programId);
  if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  // Point this program at an existing calendar (sharing its hours with
  // whatever else uses it) instead of creating a new dedicated one.
  const existingAppointmentTypeId = Number(body?.appointmentTypeId);
  if (Number.isFinite(existingAppointmentTypeId) && existingAppointmentTypeId > 0) {
    try {
      const appointmentType = await attachProgramToCalendar(programId, existingAppointmentTypeId);
      return NextResponse.json({ appointmentType }, { status: 200 });
    } catch (error: any) {
      console.error("[programs/calendar] Failed to attach:", error);
      return NextResponse.json({ error: error?.message ?? "Failed to attach calendar" }, { status: 400 });
    }
  }

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
