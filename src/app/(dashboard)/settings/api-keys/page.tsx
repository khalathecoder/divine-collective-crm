export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { ApiKeyManager } from "./ApiKeyManager";

export default async function ApiKeysPage() {
  const keys = await db
    .select({ id: apiKeys.id, name: apiKeys.name, createdAt: apiKeys.createdAt, lastUsedAt: apiKeys.lastUsedAt })
    .from(apiKeys);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">API Keys</h1>
      <p className="max-w-2xl text-sm text-gray-500">
        Give one of these to a script, or to a Claude Code session (like this one) when you want it to
        add or update programs, funnels, or contacts on your behalf via <code>/api/admin/...</code>. The
        website's connection uses the separate <code>WEBSITE_WEBHOOK_API_KEY</code> environment
        variable instead — see the API docs.
      </p>
      <ApiKeyManager initialKeys={keys} />
    </div>
  );
}
