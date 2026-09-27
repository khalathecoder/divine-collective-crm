import { NextRequest, NextResponse } from "next/server";
import { getAppointmentTypeBySlug, getAvailableSlots } from "@/lib/crm/booking";

export async function GET(req: NextRequest, { params }: { params: { typeSlug: string } }) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Query param 'date' must be YYYY-MM-DD" }, { status: 400 });
  }

  const type = await getAppointmentTypeBySlug(params.typeSlug);
  if (!type) return NextResponse.json({ error: "Unknown appointment type" }, { status: 404 });

  const slots = await getAvailableSlots(type.id, date);
  return NextResponse.json({
    appointmentType: { name: type.name, durationMinutes: type.durationMinutes, timezone: type.timezone },
    slots: slots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString() })),
  });
}
