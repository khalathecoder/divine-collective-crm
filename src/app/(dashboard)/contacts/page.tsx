export const dynamic = "force-dynamic";

import Link from "next/link";
import { listContacts } from "@/lib/crm/contacts";
import { NewContactForm } from "./NewContactForm";
import { ImportCsvForm } from "./ImportCsvForm";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const contacts = await listContacts(searchParams.search);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <p className="text-sm text-gray-500">{contacts.length} total</p>
      </div>

      <form className="max-w-sm">
        <input
          className="input"
          type="text"
          name="search"
          placeholder="Search by name or email..."
          defaultValue={searchParams.search}
        />
      </form>

      <div className="card overflow-hidden !p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {contacts.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/contacts/${c.id}`} className="font-medium text-brand hover:underline">
                    {c.name}
                  </Link>
                  {c.unsubscribedAt && (
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      Unsubscribed
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{c.email}</td>
                <td className="px-4 py-3 text-gray-600">{c.source ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand-dark">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No contacts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">Add a contact</h2>
          <NewContactForm />
        </div>
        <ImportCsvForm />
      </div>
    </div>
  );
}
