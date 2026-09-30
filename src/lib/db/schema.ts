import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  time,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Admin users (people who can log into this CRM)                      */
/* ------------------------------------------------------------------ */
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

/* ------------------------------------------------------------------ */
/* Contacts: everyone who registered or bought something                */
/* ------------------------------------------------------------------ */
export const contacts = pgTable(
  "contacts",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 40 }),
    source: varchar("source", { length: 120 }), // e.g. "website:contact-form", "instagram", "manual"
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    notes: text("notes"),
    /** Random per-contact secret used to build a one-click unsubscribe link in every marketing email. */
    unsubscribeToken: varchar("unsubscribe_token", { length: 64 }),
    /** Set the moment they unsubscribe. Once set, they're never auto-enrolled in a Funnel again. */
    unsubscribedAt: timestamp("unsubscribed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("contacts_email_idx").on(table.email),
    unsubscribeTokenIdx: uniqueIndex("contacts_unsubscribe_token_idx").on(table.unsubscribeToken),
  })
);

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/* ------------------------------------------------------------------ */
/* Contact events: an audit trail of everything that happened          */
/* (form submitted, registered for X, survey answered, etc.)           */
/* ------------------------------------------------------------------ */
export const contactEvents = pgTable(
  "contact_events",
  {
    id: serial("id").primaryKey(),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 80 }).notNull(), // contact.captured | registration.created | purchase.completed | survey.submitted | appointment.booked
    label: text("label").notNull(), // human readable, e.g. "Registered for B.O.L.D. OUT"
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    contactIdx: index("contact_events_contact_idx").on(table.contactId),
  })
);

export type ContactEvent = typeof contactEvents.$inferSelect;
export type InsertContactEvent = typeof contactEvents.$inferInsert;

/* ------------------------------------------------------------------ */
/* Programs / products, with pricing you can change any time           */
/* ------------------------------------------------------------------ */
export const programs = pgTable(
  "programs",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    priceCents: integer("price_cents").notNull().default(0),
    currency: varchar("currency", { length: 3 }).notNull().default("usd"),
    type: varchar("type", { length: 40 }).notNull().default("coaching"), // coaching | digital | event | membership
    active: boolean("active").notNull().default(true),
    /**
     * Which calendar this program's bookings pull from. Not unique on
     * purpose: several programs can point at the same calendar to share one
     * pool of hours (so booking one blocks that time for the others too),
     * or each can have its own dedicated calendar.
     */
    appointmentTypeId: integer("appointment_type_id").references(() => appointmentTypes.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("programs_slug_idx").on(table.slug),
  })
);

export type Program = typeof programs.$inferSelect;
export type InsertProgram = typeof programs.$inferInsert;

/* ------------------------------------------------------------------ */
/* Purchases: which contact bought which program                       */
/* ------------------------------------------------------------------ */
export const purchases = pgTable(
  "purchases",
  {
    id: serial("id").primaryKey(),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    programId: integer("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "restrict" }),
    amountPaidCents: integer("amount_paid_cents").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("usd"),
    paymentPlanId: varchar("payment_plan_id", { length: 120 }),
    status: varchar("status", { length: 30 }).notNull().default("completed"), // completed | refunded | canceled
    source: varchar("source", { length: 60 }).notNull().default("website"), // website | manual
    externalId: varchar("external_id", { length: 255 }), // Stripe payment intent id, etc.
    purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  },
  (table) => ({
    contactIdx: index("purchases_contact_idx").on(table.contactId),
    programIdx: index("purchases_program_idx").on(table.programId),
  })
);

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

/* ------------------------------------------------------------------ */
/* Appointment types + availability + booked appointments (calendar)   */
/* ------------------------------------------------------------------ */
export const appointmentTypes = pgTable(
  "appointment_types",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(), // e.g. "Discovery Call"
    description: text("description"),
    durationMinutes: integer("duration_minutes").notNull().default(30),
    bufferMinutes: integer("buffer_minutes").notNull().default(15),
    timezone: varchar("timezone", { length: 60 }).notNull().default("America/New_York"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("appointment_types_slug_idx").on(table.slug),
  })
);

export type AppointmentType = typeof appointmentTypes.$inferSelect;
export type InsertAppointmentType = typeof appointmentTypes.$inferInsert;

/** Recurring weekly availability, e.g. "Tuesdays 9am-12pm". */
export const availabilityRules = pgTable("availability_rules", {
  id: serial("id").primaryKey(),
  appointmentTypeId: integer("appointment_type_id")
    .notNull()
    .references(() => appointmentTypes.id, { onDelete: "cascade" }),
  weekday: integer("weekday").notNull(), // 0 = Sunday ... 6 = Saturday
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
});

export type AvailabilityRule = typeof availabilityRules.$inferSelect;
export type InsertAvailabilityRule = typeof availabilityRules.$inferInsert;

/** One-off exceptions: block a specific date, or open an extra window. */
export const availabilityOverrides = pgTable("availability_overrides", {
  id: serial("id").primaryKey(),
  appointmentTypeId: integer("appointment_type_id")
    .notNull()
    .references(() => appointmentTypes.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  isBlocked: boolean("is_blocked").notNull().default(true),
  startTime: time("start_time"),
  endTime: time("end_time"),
  note: varchar("note", { length: 255 }),
});

export type AvailabilityOverride = typeof availabilityOverrides.$inferSelect;
export type InsertAvailabilityOverride = typeof availabilityOverrides.$inferInsert;

export const appointments = pgTable(
  "appointments",
  {
    id: serial("id").primaryKey(),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    appointmentTypeId: integer("appointment_type_id")
      .notNull()
      .references(() => appointmentTypes.id, { onDelete: "restrict" }),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 30 }).notNull().default("confirmed"), // confirmed | canceled | completed
    notes: text("notes"),
    reminder24hSentAt: timestamp("reminder_24h_sent_at"),
    reminder1hSentAt: timestamp("reminder_1h_sent_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    startAtIdx: index("appointments_start_at_idx").on(table.startAt),
    contactIdx: index("appointments_contact_idx").on(table.contactId),
  })
);

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

/* ------------------------------------------------------------------ */
/* Email funnels: per-program sequences triggered on purchase           */
/* ------------------------------------------------------------------ */
export const funnels = pgTable("funnels", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").references(() => programs.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  triggerEvent: varchar("trigger_event", { length: 60 }).notNull().default("purchase.completed"), // purchase.completed | registration.created
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Funnel = typeof funnels.$inferSelect;
export type InsertFunnel = typeof funnels.$inferInsert;

export const funnelSteps = pgTable(
  "funnel_steps",
  {
    id: serial("id").primaryKey(),
    funnelId: integer("funnel_id")
      .notNull()
      .references(() => funnels.id, { onDelete: "cascade" }),
    stepOrder: integer("step_order").notNull(),
    delayHours: integer("delay_hours").notNull().default(0), // hours after the previous step (or after enrollment for step 1)
    subject: varchar("subject", { length: 255 }).notNull(),
    bodyHtml: text("body_html").notNull(),
    surveyId: integer("survey_id"),
  },
  (table) => ({
    funnelIdx: index("funnel_steps_funnel_idx").on(table.funnelId),
  })
);

export type FunnelStep = typeof funnelSteps.$inferSelect;
export type InsertFunnelStep = typeof funnelSteps.$inferInsert;

export const funnelEnrollments = pgTable(
  "funnel_enrollments",
  {
    id: serial("id").primaryKey(),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    funnelId: integer("funnel_id")
      .notNull()
      .references(() => funnels.id, { onDelete: "cascade" }),
    currentStep: integer("current_step").notNull().default(0), // 0 = not sent anything yet
    nextSendAt: timestamp("next_send_at").notNull().defaultNow(),
    status: varchar("status", { length: 30 }).notNull().default("active"), // active | completed | canceled
    enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  },
  (table) => ({
    dueIdx: index("funnel_enrollments_due_idx").on(table.status, table.nextSendAt),
    contactFunnelIdx: uniqueIndex("funnel_enrollments_contact_funnel_idx").on(
      table.contactId,
      table.funnelId
    ),
  })
);

export type FunnelEnrollment = typeof funnelEnrollments.$inferSelect;
export type InsertFunnelEnrollment = typeof funnelEnrollments.$inferInsert;

export const funnelSends = pgTable("funnel_sends", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id")
    .notNull()
    .references(() => funnelEnrollments.id, { onDelete: "cascade" }),
  stepId: integer("step_id")
    .notNull()
    .references(() => funnelSteps.id, { onDelete: "cascade" }),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export type FunnelSend = typeof funnelSends.$inferSelect;
export type InsertFunnelSend = typeof funnelSends.$inferInsert;

/* ------------------------------------------------------------------ */
/* Surveys                                                              */
/* ------------------------------------------------------------------ */
export interface SurveyQuestion {
  id: string;
  label: string;
  type: "text" | "textarea" | "single_choice" | "multiple_choice";
  options?: string[];
  required?: boolean;
}

export const surveys = pgTable(
  "surveys",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    questions: jsonb("questions").$type<SurveyQuestion[]>().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("surveys_slug_idx").on(table.slug),
  })
);

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = typeof surveys.$inferInsert;

export const surveyResponses = pgTable("survey_responses", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id")
    .notNull()
    .references(() => surveys.id, { onDelete: "cascade" }),
  contactId: integer("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  answers: jsonb("answers").$type<Record<string, string>>().notNull().default({}),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = typeof surveyResponses.$inferInsert;

/* ------------------------------------------------------------------ */
/* API keys used by the website (or other tools) to talk to this CRM   */
/* ------------------------------------------------------------------ */
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  keyHash: text("key_hash").notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;
