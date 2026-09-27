# Your team and the CRM

Aaron, Cody, Mark, Angelina, Dolly, Frannie, Jerry, Maya, Vicky (and Patty, the email marketing
specialist) are Claude Code **skills** — a set of instructions Claude follows when you ask for a
specific kind of help. They are not background bots with their own login to this CRM; they don't run
on a schedule, and they can't act on their own. Each one writes or plans something for you, and then
you (or a Claude Code session working on your behalf) put that work into the CRM.

The bridge between "a skill wrote this" and "it's live in the CRM" is the **Admin API** — see
[API.md](API.md). Create an API key under **Settings → API Keys**, and a Claude Code session can then
add a program, write a funnel step, or update a survey directly, the same way the dashboard UI does.

| Skill | What they do | Where it lands in this CRM | How it gets there |
|---|---|---|---|
| **Aaron** — Business Coach | Pricing, offers, packaging, launch strategy, revenue goals | Programs & Pricing, Dashboard (revenue) | His recommendation becomes the price/name/description on a Program |
| **Cody** — Copywriter | Sales pages, program descriptions, headlines, CTAs | Programs & Pricing (description), Email Funnels (subject/body), Surveys (wording) | Paste his copy into a Program description or a Funnel step |
| **Mark** — Launch Specialist | Rollout timeline, campaign calendar, countdown, asset checklist | Email Funnels (step timing), Calendar (blocked/open days around launch) | His timeline sets each Funnel step's "send this many hours after..." delay |
| **Angelina** — Translator | Translates content into other languages | Email Funnels, Surveys | Create a second Funnel/Survey with her translated copy for a language-specific segment |
| **Dolly** — Graphic Designer | Social graphics, email banners, quote cards | Email Funnels (images in the HTML body) | Host her image publicly and add an `<img>` tag to a Funnel step |
| **Frannie** — Feedback Coach | Reviews writing for tone and clarity | Quality check before publishing Funnels/Surveys | Have her review a step's copy before you mark the Funnel Active |
| **Jerry** — Press Releases | Media announcements, press kits | Contacts (new leads, source = "press") | Coverage drives traffic to the website, which reports new Contacts automatically |
| **Maya** — Course Creator | Builds the actual course/workbook content | What a Program delivers; linked in post-purchase Funnel steps | Link her workbook/course in the email that fires after purchase |
| **Vicky** — Viral Scripter | Short-form video scripts and hooks | Contacts (new leads, source = "social") | Video drives traffic to `/book` or a lead magnet, which creates a Contact |
| **Patty** — Email Marketing | Writes email sequences and campaigns (previously built around GoHighLevel) | Email Funnels — her main workspace now | Her sequences become the steps of a Funnel here |

## A concrete example

Say Nancy is launching a new 6-week program:

1. **Aaron** helps decide the price and positioning → you create the Program with that price.
2. **Cody** writes the sales copy and the welcome-email sequence → the copy becomes the Program
   description; the sequence becomes a Funnel's steps (triggered on `purchase.completed` for that
   Program).
3. **Mark** lays out the launch week timeline → sets the delay-hours between Funnel steps and blocks
   Nancy's calendar around the launch.
4. **Frannie** reviews the emails before they go live.
5. **Vicky** and **Jerry** drive traffic (video + press) → new Contacts show up automatically as
   people visit the website and register or buy.

Everything after step 2 keeps running on its own — the Funnel fires for every future buyer of that
Program without anyone re-doing the work.
