# API reference

Two separate keys guard two separate doors:

- **`WEBSITE_WEBHOOK_API_KEY`** (an environment variable, set once on Railway) — lets the
  dicollectivellc.com website report events to `/api/webhooks/website`.
- **API keys created under Settings → API Keys** — let a script or a Claude Code session manage
  everything else (contacts, programs, funnels, surveys) via `/api/admin/*`, the same routes the
  dashboard itself uses. Pass one as `Authorization: Bearer <key>`. A logged-in browser session works
  too, so the dashboard doesn't need a key.

## POST /api/webhooks/website

Header: `x-api-key: <WEBSITE_WEBHOOK_API_KEY>`

Body:

```jsonc
{
  "type": "contact.captured" | "registration.created" | "purchase.completed" | "survey.submitted",
  "contact": { "name": "Jane Doe", "email": "jane@example.com", "phone": "555-0100" },
  "source": "website:contact-form",       // optional, freeform
  "tags": ["some-tag"],                    // optional
  "programSlug": "called-crowned-6week",   // required for registration/purchase events — must match a Program's slug in this CRM
  "amountCents": 149700,                   // purchase.completed only
  "currency": "usd",                       // purchase.completed only, defaults to the program's currency
  "paymentPlanId": "6week-2pay",           // purchase.completed only, optional
  "externalId": "pi_123...",               // purchase.completed only — the Stripe payment intent id, used to avoid double-counting
  "surveySlug": "bold-out-intake",         // survey.submitted only
  "surveyAnswers": { "question": "answer" } // survey.submitted only
}
```

What happens:

- The contact is created or updated (matched by email). Tags are merged, not replaced.
- A `purchase.completed` event creates a Purchase record against the matching Program and enrolls the
  contact in any active Funnel for that Program (or any "any program" Funnel with that trigger).
- A `registration.created` event enrolls the contact in Funnels whose trigger is "registers" instead
  of "buys," without creating a Purchase.
- Every event is logged to the contact's timeline either way.

Response: `{ "ok": true, "contactId": 123 }` or a 4xx/5xx with `{ "error": "..." }`.

## Admin API (`/api/admin/*`)

All of these require either a logged-in session or `Authorization: Bearer <api-key>`.

| Method & path | Purpose |
|---|---|
| `GET /api/admin/contacts?search=` | List/search contacts |
| `GET /api/admin/contacts/:id` | Contact detail with full history |
| `GET /api/admin/programs` | List programs |
| `POST /api/admin/programs` | Create a program |
| `PATCH /api/admin/programs/:id` | Update a program — send `{ "priceCents": 9700 }` to change price |
| `GET /api/admin/appointment-types` | List appointment types with their availability |
| `POST /api/admin/appointment-types` | Create an appointment type |
| `POST /api/admin/availability` | Add a weekly rule; add `?kind=override` to block/open a specific date |
| `DELETE /api/admin/availability?id=&kind=` | Remove a rule or override |
| `GET /api/admin/appointments?upcoming=true` | List appointments |
| `GET /api/admin/funnels` | List funnels with their steps |
| `POST /api/admin/funnels` | Create a funnel (`programId`, `triggerEvent`) |
| `PATCH /api/admin/funnels/:id` | Update a funnel |
| `POST /api/admin/funnels/:id/steps` | Add a step (`delayHours`, `subject`, `bodyHtml`) |
| `PATCH /api/admin/funnels/steps/:stepId` | Edit a step |
| `DELETE /api/admin/funnels/steps/:stepId` | Remove a step |
| `GET /api/admin/surveys` | List surveys |
| `POST /api/admin/surveys` | Create a survey |
| `GET /api/admin/surveys/:id` | Survey detail with all responses |
| `PATCH /api/admin/surveys/:id` | Replace a survey's questions |
| `GET /api/admin/api-keys` | List API keys (not their raw values) |
| `POST /api/admin/api-keys` | Create a key — the raw value is shown exactly once |
| `DELETE /api/admin/api-keys?id=` | Revoke a key |

## Public booking API (used by the `/book` pages, no key required)

- `GET /api/book/:typeSlug/availability?date=YYYY-MM-DD` → available time slots for that day
- `POST /api/book/:typeSlug` → `{ "start": "<ISO datetime>", "name", "email", "phone?" }` to book

## Public survey API (used by the `/survey/:slug` page, no key required)

- `GET /api/survey/:slug` → the survey's questions
- `POST /api/survey/:slug` → `{ "name", "email", "phone?", "answers": { "question label": "answer" } }`
