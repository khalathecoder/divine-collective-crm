import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminRequest } from "@/lib/adminGuard";
import {
  listPrograms,
  createProgram,
  createProgramWithCalendar,
  programTypeRequiresCalendar,
} from "@/lib/crm/programs";

const calendarSchema = z.object({
  durationMinutes: z.number().int().positive().default(30),
  bufferMinutes: z.number().int().nonnegative().default(15),
  timezone: z.string().min(1).default("America/New_York"),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const createSchema = z
  .object({
    slug: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    priceCents: z.number().int().nonnegative(),
    currency: z.string().length(3).default("usd"),
    type: z.enum(["coaching", "digital", "event", "membership"]).default("coaching"),
    active: z.boolean().default(true),
    calendar: calendarSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (programTypeRequiresCalendar(data.type) && !data.calendar) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["calendar"],
        message: `A "${data.type}" program needs at least one weekly availability block set up.`,
      });
    }
  });

export async function GET(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;
  return NextResponse.json({ programs: await listPrograms() });
}

export async function POST(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid program", details: parsed.error.flatten() }, { status: 400 });
  }

  const { calendar, ...programInput } = parsed.data;

  try {
    if (calendar) {
      const { program, appointmentType } = await createProgramWithCalendar(programInput, calendar);
      return NextResponse.json({ program, appointmentType }, { status: 201 });
    }
    const program = await createProgram(programInput);
    return NextResponse.json({ program }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "That slug is already used by another program or calendar." },
        { status: 409 }
      );
    }
    console.error("[programs] Failed to create:", error);
    return NextResponse.json({ error: "Failed to create program" }, { status: 500 });
  }
}
