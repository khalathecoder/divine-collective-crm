export const dynamic = "force-dynamic";

import { listContacts } from "@/lib/crm/contacts";
import { NewContactForm } from "./NewContactForm";
import { ImportCsvForm } from "./ImportCsvForm";
import { ImportOrdersForm } from "./ImportOrdersForm";
import { ContactsTable } from "./ContactsTable";

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

      <ContactsTable contacts={contacts} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">Add a contact</h2>
          <NewContactForm />
        </div>
        <ImportCsvForm />
        <ImportOrdersForm />
      </div>
    </div>
  );
}
