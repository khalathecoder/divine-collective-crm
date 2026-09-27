# Going live: step by step

This walks you through putting the CRM online at `crm.dicollectivellc.com`, using Railway to host it.
Budget about 30-45 minutes the first time. If you get stuck on any step, come back to this Claude Code
session (or start a new one) and paste what you're seeing — screenshots are fine.

## Part 1 — Create your Railway project

1. Go to **railway.app** and sign up (the "Login with GitHub" option is easiest since your code is
   already on GitHub).
2. Once you're in, click **New Project**.
3. Choose **Deploy from GitHub repo**, and pick `khalathecoder/divine-collective-crm`. If Railway asks
   for permission to access your GitHub repos, approve it (you can limit it to just this one repo).
4. Railway will start building it automatically — don't worry that it will fail the first time; it
   needs a database and some settings first (next steps).

## Part 2 — Add the database

1. Inside your new Railway project, click **+ New** → **Database** → **Add PostgreSQL**.
2. That's it — Railway automatically creates a `DATABASE_URL` and makes it available to your app. You
   don't need to copy/paste anything for this part.

## Part 3 — Set the environment variables

1. Click on your CRM service (not the database) → the **Variables** tab.
2. Add each of these (click "New Variable" for each one). Use the `.env.example` file in the repo as
   your checklist:

   | Variable | What to put |
   |---|---|
   | `SESSION_SECRET` | Any long random text — mash your keyboard for 40+ characters, or ask Claude to generate one |
   | `ADMIN_EMAIL` | The email you'll log into the CRM with (e.g. `nmd.dixon@gmail.com`) |
   | `ADMIN_PASSWORD` | A strong password for that login — change it after your first login if you'd like |
   | `ADMIN_NAME` | Your name |
   | `PRIVATE_EMAIL_SMTP_HOST` | Same value the website uses — check the website's Railway/host variables, or your Private Email / Namecheap account settings |
   | `PRIVATE_EMAIL_SMTP_PORT` | Usually `465` |
   | `PRIVATE_EMAIL_SMTP_SECURE` | `true` |
   | `PRIVATE_EMAIL_SMTP_USER` | The mailbox address (e.g. `hello@dicollectivellc.com`) |
   | `PRIVATE_EMAIL_SMTP_PASSWORD` | That mailbox's password |
   | `PRIVATE_EMAIL_FROM` | e.g. `Divine Collective <hello@dicollectivellc.com>` |
   | `WEBSITE_WEBHOOK_API_KEY` | Any long random text — you'll put this SAME value on the website side later, when we connect them |
   | `APP_URL` | `https://crm.dicollectivellc.com` |

3. Railway will redeploy automatically each time you save a variable. Once all of the above are set,
   it should build and start successfully — check the **Deployments** tab for a green checkmark.

## Part 4 — Point crm.dicollectivellc.com at it

1. In Railway, on your CRM service, go to **Settings → Networking → Custom Domain**, and enter
   `crm.dicollectivellc.com`. Railway will show you a target value (something like
   `xyz.up.railway.app` or a CNAME record).
2. Go to wherever `dicollectivellc.com`'s DNS is managed (likely Namecheap, since that's who you use
   for email). Find the **DNS / Advanced DNS** settings for the domain.
3. Add a new **CNAME record**:
   - Host: `crm`
   - Value: the target Railway gave you in step 1
   - TTL: leave at the default
4. Save it. DNS changes can take anywhere from a few minutes to a few hours to work everywhere — this
   is normal, not a sign something's broken.
5. Once it resolves, visiting `https://crm.dicollectivellc.com` should show your CRM's login page.

## Part 5 — Log in and check everything

1. Go to `https://crm.dicollectivellc.com/login` and sign in with the `ADMIN_EMAIL` /
   `ADMIN_PASSWORD` you set in Part 3.
2. You should see a "Discovery Call" appointment type already set up under **Calendar → Manage
   availability** (weekdays, 10am-4pm Eastern by default) — adjust it to your real hours.
3. Try the public booking page yourself: `https://crm.dicollectivellc.com/book`.
4. Add your first real Program under **Programs & Pricing**, matching the `slug` you'll use on the
   website side (see [API.md](API.md)).

## Connecting the website (later, when you're ready)

The dicollectivellc.com website isn't sending anything to this CRM yet — that's a separate,
deliberate step so nothing changes on the live site until you say go. When you're ready:

1. Put the same value you used for `WEBSITE_WEBHOOK_API_KEY` here into the website's own environment
   variables (as `CRM_WEBHOOK_API_KEY`, or whatever name we agree on).
2. Add `CRM_WEBHOOK_URL=https://crm.dicollectivellc.com/api/webhooks/website` to the website too.
3. Tell Claude Code you're ready, and it will wire up the website's contact form, registrations, and
   Stripe purchases to report here — replacing the current GoHighLevel connection.
