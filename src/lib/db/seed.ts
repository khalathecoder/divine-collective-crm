import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index";
import { adminUsers, appointmentTypes, availabilityRules } from "./schema";
import { eq } from "drizzle-orm";

/**
 * Runs on every deploy, right before the server starts (see the `db:seed`
 * step in railway.json's startCommand). Safe to run repeatedly — it only
 * creates things that don't exist yet.
 */
export async function seed() {
  await seedFirstAdmin();
  await seedDefaultDiscoveryCall();
}

async function seedFirstAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";
  if (!email || !password) return;

  const existing = await db.query.adminUsers.findFirst({ where: eq(adminUsers.email, email) });
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(adminUsers).values({ email, passwordHash, name });
  console.log(`[seed] Created first admin user: ${email}`);
}

async function seedDefaultDiscoveryCall() {
  const existing = await db.query.appointmentTypes.findFirst({
    where: eq(appointmentTypes.slug, "discovery-call"),
  });
  if (existing) return;

  const [created] = await db
    .insert(appointmentTypes)
    .values({
      slug: "discovery-call",
      name: "Discovery Call",
      description: "A free call to see if we're a good fit to work together.",
      durationMinutes: 30,
      bufferMinutes: 15,
      timezone: "America/New_York",
    })
    .returning();

  if (!created) return;

  // Default availability: weekdays 10am-4pm Eastern. Editable in Settings > Availability.
  for (const weekday of [1, 2, 3, 4, 5]) {
    await db.insert(availabilityRules).values({
      appointmentTypeId: created.id,
      weekday,
      startTime: "10:00",
      endTime: "16:00",
    });
  }
  console.log("[seed] Created default 'Discovery Call' appointment type with weekday availability.");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed] Failed:", error);
    process.exit(1);
  });
