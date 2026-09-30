import { relations } from "drizzle-orm";
import {
  contacts,
  contactEvents,
  purchases,
  programs,
  appointments,
  appointmentTypes,
  availabilityRules,
  availabilityOverrides,
  funnels,
  funnelSteps,
  funnelEnrollments,
  funnelSends,
  surveys,
  surveyResponses,
} from "./schema";

export const contactsRelations = relations(contacts, ({ many }) => ({
  events: many(contactEvents),
  purchases: many(purchases),
  appointments: many(appointments),
  surveyResponses: many(surveyResponses),
  funnelEnrollments: many(funnelEnrollments),
}));

export const contactEventsRelations = relations(contactEvents, ({ one }) => ({
  contact: one(contacts, { fields: [contactEvents.contactId], references: [contacts.id] }),
}));

export const programsRelations = relations(programs, ({ many, one }) => ({
  purchases: many(purchases),
  funnels: many(funnels),
  appointmentType: one(appointmentTypes, {
    fields: [programs.appointmentTypeId],
    references: [appointmentTypes.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  contact: one(contacts, { fields: [purchases.contactId], references: [contacts.id] }),
  program: one(programs, { fields: [purchases.programId], references: [programs.id] }),
}));

export const appointmentTypesRelations = relations(appointmentTypes, ({ many }) => ({
  appointments: many(appointments),
  availabilityRules: many(availabilityRules),
  availabilityOverrides: many(availabilityOverrides),
  programs: many(programs),
}));

export const availabilityRulesRelations = relations(availabilityRules, ({ one }) => ({
  appointmentType: one(appointmentTypes, {
    fields: [availabilityRules.appointmentTypeId],
    references: [appointmentTypes.id],
  }),
}));

export const availabilityOverridesRelations = relations(availabilityOverrides, ({ one }) => ({
  appointmentType: one(appointmentTypes, {
    fields: [availabilityOverrides.appointmentTypeId],
    references: [appointmentTypes.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  contact: one(contacts, { fields: [appointments.contactId], references: [contacts.id] }),
  appointmentType: one(appointmentTypes, {
    fields: [appointments.appointmentTypeId],
    references: [appointmentTypes.id],
  }),
}));

export const funnelsRelations = relations(funnels, ({ one, many }) => ({
  program: one(programs, { fields: [funnels.programId], references: [programs.id] }),
  steps: many(funnelSteps),
  enrollments: many(funnelEnrollments),
}));

export const funnelStepsRelations = relations(funnelSteps, ({ one, many }) => ({
  funnel: one(funnels, { fields: [funnelSteps.funnelId], references: [funnels.id] }),
  sends: many(funnelSends),
}));

export const funnelEnrollmentsRelations = relations(funnelEnrollments, ({ one, many }) => ({
  contact: one(contacts, { fields: [funnelEnrollments.contactId], references: [contacts.id] }),
  funnel: one(funnels, { fields: [funnelEnrollments.funnelId], references: [funnels.id] }),
  sends: many(funnelSends),
}));

export const funnelSendsRelations = relations(funnelSends, ({ one }) => ({
  enrollment: one(funnelEnrollments, {
    fields: [funnelSends.enrollmentId],
    references: [funnelEnrollments.id],
  }),
  step: one(funnelSteps, { fields: [funnelSends.stepId], references: [funnelSteps.id] }),
}));

export const surveysRelations = relations(surveys, ({ many }) => ({
  responses: many(surveyResponses),
}));

export const surveyResponsesRelations = relations(surveyResponses, ({ one }) => ({
  survey: one(surveys, { fields: [surveyResponses.surveyId], references: [surveys.id] }),
  contact: one(contacts, { fields: [surveyResponses.contactId], references: [contacts.id] }),
}));
