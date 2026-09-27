/**
 * Custom server instead of Next.js's built-in `next start`. This lets the
 * background scheduler (funnel emails + appointment reminders) run inside
 * the same long-lived process Railway keeps alive — without going through
 * Next's instrumentation.ts, whose Edge-runtime bundling chokes on Node-only
 * packages like `pg` and `node-cron`.
 */
import "dotenv/config";
import { createServer } from "node:http";
import next from "next";
import { startScheduler } from "./src/lib/crm/scheduler";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, () => {
    console.log(`> Divine Collective CRM ready on port ${port}`);
  });

  startScheduler();
});
