# Divine Collective CRM

A custom CRM for [dicollectivellc.com](https://dicollectivellc.com) — Divine Collective LLC / Purely
Divine Coaching. It replaces the need for a third-party CRM (like GoHighLevel) with a system you fully
own, built specifically around how Nancy's programs, contacts, and launches actually work.

## What it does

- **Contacts** — everyone who registers or buys something through the website or a booking link,
  with a full timeline of what they did and when.
- **Calendar** — bookable appointment types (e.g. Discovery Call) with editable weekly availability,
  one-off blocked days, and automatic 24-hour / 1-hour email reminders.
- **Programs & Pricing** — every program/product, with pricing you can change any time. See at a
  glance who bought a given program, and copy their emails for a targeted send.
- **Email Funnels** — a sequence of emails that fires automatically when someone buys (or registers
  for) a specific program. Each program gets its own funnel.
- **Surveys** — build a survey once, link it from a funnel email or share it directly; responses are
  attached to the contact.
- **A documented API** — so the dicollectivellc.com website can report new contacts/purchases here,
  and so a Claude Code session (or a script) can manage things on your behalf.

See [docs/SKILLS.md](docs/SKILLS.md) for how Nancy's content team (Aaron, Cody, Mark, Angelina, Dolly,
Frannie, Jerry, Maya, Vicky, Patty) maps onto these features, [docs/API.md](docs/API.md) for the full
API reference, and [docs/DEPLOY.md](docs/DEPLOY.md) for the plain-English, step-by-step guide to
putting this live on Railway at `crm.dicollectivellc.com`.

## Tech stack

Next.js (App Router) + TypeScript, Postgres via Drizzle ORM, a background scheduler
(`node-cron`, started in `src/instrumentation.ts`) that sends due funnel emails and appointment
reminders every 5 minutes, and outgoing email via the same Private Email / Namecheap SMTP mailbox the
website already uses. No separate worker process is needed — Railway runs this as one long-lived app.

## Local development

```bash
cp .env.example .env      # fill in a local Postgres URL and the other values
npm install
npm run db:generate       # only needed after changing src/lib/db/schema.ts
npm run db:migrate        # applies drizzle/*.sql to your database
npm run dev
```

The first time the app boots, it automatically creates the first admin login from `ADMIN_EMAIL` /
`ADMIN_PASSWORD` in your `.env`, and a default "Discovery Call" appointment type.

## Project layout

```
src/
  app/                 Pages (admin dashboard) and API routes
    (dashboard)/       Logged-in admin pages: contacts, programs, calendar, funnels, surveys, settings
    book/[typeSlug]/   Public booking page (embed or link to this from the website)
    survey/[slug]/     Public survey page
    api/webhooks/      Where the website reports contacts/purchases (see docs/API.md)
    api/admin/         Authenticated CRUD API behind a login session or an API key
    api/book/          Public booking availability + submission API
  lib/
    db/                Drizzle schema, relations, migration + seed scripts
    crm/               Core logic: contacts, programs, booking, funnels, surveys, the scheduler
    auth.ts            Admin session (cookie) handling
    apiAuth.ts          Webhook key + API key verification
    email.ts            Outgoing email via Private Email SMTP
```
