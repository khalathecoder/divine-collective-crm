/**
 * Next.js calls `register()` exactly once when the server process starts.
 * Railway runs this app as a long-lived process (not serverless), so it's a
 * safe place to seed first-run data and start the background scheduler that
 * sends funnel emails and appointment reminders.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { seed } = await import("./lib/db/seed");
  await seed().catch((error) => console.error("[startup] seed failed:", error));

  const { startScheduler } = await import("./lib/crm/scheduler");
  startScheduler();
}
