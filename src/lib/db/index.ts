import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import * as relations from "./relations";

declare global {
  // eslint-disable-next-line no-var
  var __crmPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __crmDb: NodePgDatabase<typeof schema & typeof relations> | undefined;
}

type Db = NodePgDatabase<typeof schema & typeof relations>;

function getRealDb(): Db {
  if (!global.__crmDb) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    if (!global.__crmPool) {
      global.__crmPool = new Pool({ connectionString: process.env.DATABASE_URL });
    }
    global.__crmDb = drizzle(global.__crmPool, { schema: { ...schema, ...relations } });
  }
  return global.__crmDb;
}

/**
 * A lazy stand-in for the real drizzle client. Reading `db.anything` creates
 * the connection pool on first use. This matters because Next.js imports
 * every route module while collecting build data — if connecting happened at
 * import time (module top level) instead, `next build` itself would need a
 * live DATABASE_URL, which isn't available during Railway's build step.
 */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getRealDb(), prop, receiver);
  },
});

/**
 * For code that needs the real client directly (e.g. `db.transaction(...)`),
 * bypassing the lazy proxy to avoid any risk of `this` binding surprises
 * inside multi-step transactional logic.
 */
export const getDb = getRealDb;

export type { Db };
