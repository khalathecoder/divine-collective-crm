import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

async function main() {
  if (!process.env.DATABASE_URL) {
    // Without this check, `pg` silently falls back to a local default
    // (localhost:5432) instead of failing clearly, which shows up as a
    // confusing ECONNREFUSED instead of the actual missing-config problem.
    throw new Error(
      "DATABASE_URL is not set. Make sure the app service has a DATABASE_URL " +
        "variable referencing your Postgres service (e.g. ${{Postgres.DATABASE_URL}})."
    );
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await pool.end();
  console.log("Migrations complete.");
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
