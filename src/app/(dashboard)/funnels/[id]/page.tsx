export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getFunnel } from "@/lib/crm/funnels";
import { listSurveys } from "@/lib/crm/surveys";
import { StepList } from "./StepList";
import { NewStepForm } from "./NewStepForm";

export default async function FunnelDetailPage({ params }: { params: { id: string } }) {
  const funnel = await getFunnel(Number(params.id));
  if (!funnel) notFound();
  const surveys = await listSurveys();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/funnels" className="text-sm text-brand hover:underline">← All funnels</Link>
        <h1 className="mt-1 text-2xl font-semibold">{funnel.name}</h1>
        <p className="text-gray-500">
          For {funnel.program?.name ?? "any program"} — starts when someone{" "}
          {funnel.triggerEvent === "purchase.completed" ? "completes a purchase" : "registers"}.
        </p>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Steps (sent in order)</h2>
        <StepList steps={funnel.steps} surveys={surveys} />
      </div>

      <div className="card max-w-lg">
        <h2 className="mb-3 font-semibold">Add a step</h2>
        <NewStepForm funnelId={funnel.id} nextOrder={funnel.steps.length} surveys={surveys} />
      </div>
    </div>
  );
}
