import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppointmentTypeBySlug, bookAppointment } from "@/lib/crm/booking";

const schema = z.object({
  start: z.string().datetime(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { typeSlug: string } }) {
  const type = await getAppointmentTypeBySlug(params.typeSlug);
  if (!type) return NextResponse.json({ error: "Unknown appointment type" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking request", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const appointment = await bookAppointment({
      appointmentTypeId: type.id,
      start: new Date(parsed.data.start),
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      notes: parsed.data.notes,
    });
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("[book] Failed to create appointment:", error);
    return NextResponse.json({ error: "That time is no longer available. Please pick another." }, { status: 409 });
  }
}
