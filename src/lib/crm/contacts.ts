import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { contacts, contactEvents, type Contact, type InsertContact } from "../db/schema";

export interface UpsertContactInput {
  name: string;
  email: string;
  phone?: string | null;
  source?: string | null;
  addTags?: string[];
}

/** Creates the contact if the email is new, otherwise fills in any blanks and merges tags. */
export async function upsertContact(input: UpsertContactInput): Promise<Contact> {
  const email = input.email.trim().toLowerCase();
  const existing = await db.query.contacts.findFirst({ where: eq(contacts.email, email) });

  if (!existing) {
    const [created] = await db
      .insert(contacts)
      .values({
        name: input.name,
        email,
        phone: input.phone ?? null,
        source: input.source ?? null,
        tags: input.addTags ?? [],
      })
      .returning();
    if (!created) throw new Error("Failed to create contact");
    return created;
  }

  const mergedTags = Array.from(new Set([...existing.tags, ...(input.addTags ?? [])]));
  const [updated] = await db
    .update(contacts)
    .set({
      name: existing.name || input.name,
      phone: existing.phone ?? input.phone ?? null,
      source: existing.source ?? input.source ?? null,
      tags: mergedTags,
      updatedAt: new Date(),
    })
    .where(eq(contacts.id, existing.id))
    .returning();
  if (!updated) throw new Error("Failed to update contact");
  return updated;
}

export interface CreateContactInput {
  name: string;
  email: string;
  phone?: string;
  source?: string;
  tags?: string[];
  notes?: string;
}

/** Manual "Add contact" from the CRM dashboard. Throws if the email is already in use. */
export async function createContact(input: CreateContactInput): Promise<Contact> {
  const email = input.email.trim().toLowerCase();
  const [created] = await db
    .insert(contacts)
    .values({
      name: input.name,
      email,
      phone: input.phone || null,
      source: input.source || "manual",
      tags: input.tags ?? [],
      notes: input.notes || null,
    })
    .returning();
  if (!created) throw new Error("Failed to create contact");
  await logContactEvent(created.id, "contact.created", "Added manually in the CRM");
  return created;
}

export async function updateContact(id: number, input: Partial<InsertContact>): Promise<Contact> {
  const patch = { ...input };
  if (typeof patch.email === "string") patch.email = patch.email.trim().toLowerCase();

  const [updated] = await db
    .update(contacts)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(contacts.id, id))
    .returning();
  if (!updated) throw new Error("Contact not found");
  return updated;
}

export async function deleteContact(id: number): Promise<void> {
  await db.delete(contacts).where(eq(contacts.id, id));
}

export async function logContactEvent(
  contactId: number,
  type: string,
  label: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  await db.insert(contactEvents).values({ contactId, type, label, payload });
}

export async function listContacts(search?: string): Promise<Contact[]> {
  if (!search) {
    return db.query.contacts.findMany({ orderBy: (c, { desc }) => [desc(c.createdAt)] });
  }
  const term = `%${search.toLowerCase()}%`;
  return db
    .select()
    .from(contacts)
    .where(sql`lower(${contacts.name}) like ${term} or lower(${contacts.email}) like ${term}`)
    .orderBy(sql`${contacts.createdAt} desc`);
}

export async function getContactWithHistory(id: number) {
  const contact = await db.query.contacts.findFirst({ where: eq(contacts.id, id) });
  if (!contact) return null;

  const [events, purchaseRows, appointmentRows, responseRows] = await Promise.all([
    db.query.contactEvents.findMany({
      where: eq(contactEvents.contactId, id),
      orderBy: (e, { desc }) => [desc(e.createdAt)],
    }),
    db.query.purchases.findMany({
      where: (p, { eq }) => eq(p.contactId, id),
      with: { program: true },
    }),
    db.query.appointments.findMany({
      where: (a, { eq }) => eq(a.contactId, id),
      with: { appointmentType: true },
    }),
    db.query.surveyResponses.findMany({
      where: (r, { eq }) => eq(r.contactId, id),
      with: { survey: true },
    }),
  ]);

  return { contact, events, purchases: purchaseRows, appointments: appointmentRows, surveyResponses: responseRows };
}

/** Contacts who purchased a specific program — for targeted emails. */
export async function listContactsByProgram(programId: number): Promise<Contact[]> {
  const rows = await db.query.purchases.findMany({
    where: (p, { eq }) => eq(p.programId, programId),
    with: { contact: true },
  });
  const byId = new Map<number, Contact>();
  for (const row of rows) byId.set(row.contact.id, row.contact);
  return Array.from(byId.values());
}

export async function listContactsByTag(tag: string): Promise<Contact[]> {
  const all = await db.query.contacts.findMany();
  return all.filter((c) => c.tags.includes(tag));
}
