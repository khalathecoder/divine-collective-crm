import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findAdminByEmail, verifyPassword, createSessionCookie } from "@/lib/auth";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const user = await findAdminByEmail(parsed.data.email);
  const valid = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
  if (!user || !valid) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }

  await createSessionCookie(user.id);
  return NextResponse.json({ ok: true });
}
