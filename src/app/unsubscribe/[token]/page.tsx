export const dynamic = "force-dynamic";

import { unsubscribeByToken } from "@/lib/crm/contacts";

export default async function UnsubscribePage({ params }: { params: { token: string } }) {
  const contact = await unsubscribeByToken(params.token);

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-24 text-center">
      {contact ? (
        <>
          <h1 className="text-xl font-semibold text-brand-dark">You're unsubscribed</h1>
          <p className="text-gray-500">
            {contact.email} won't receive any more automated emails from us. If that was a mistake,
            just reach out and we'll happily add you back.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold text-brand-dark">Link not recognized</h1>
          <p className="text-gray-500">This unsubscribe link isn't valid or has already been used.</p>
        </>
      )}
    </div>
  );
}
