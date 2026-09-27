import { NextRequest, NextResponse } from "next/server";
import { gte } from "drizzle-orm";
import { guardAdminRequest } from "@/lib/adminGuard";
import { db } from "@/lib/db";
import { appointments } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  const denied = await guardAdminRequest(req);
  if (denied) return denied;

  const upcomingOnly = req.nextUrl.searchParams.get("upcoming") !== "false";
  const rows = await db.query.appointments.findMany({
    where: upcomingOnly ? gte(appointments.startAt, new Date(Date.now() - 24 * 60 * 60 * 1000)) : undefined,
    with: { contact: true, appointmentType: true },
    orderBy: (a, { asc }) => [asc(a.startAt)],
  });
  return NextResponse.json({ appointments: rows });
}
