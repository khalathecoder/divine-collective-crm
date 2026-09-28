export const dynamic = "force-dynamic";

import { listPrograms } from "@/lib/crm/programs";
import { NewProgramForm } from "./NewProgramForm";
import { ImportLiveButton } from "./ImportLiveButton";
import { ProgramsTabs } from "./ProgramsTabs";

export default async function ProgramsPage() {
  const programs = await listPrograms();
  const active = programs.filter((p) => p.active);
  const inactive = programs.filter((p) => !p.active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Programs & Pricing</h1>
        <ImportLiveButton />
      </div>

      <ProgramsTabs active={active} inactive={inactive} />

      <div className="card max-w-lg">
        <h2 className="mb-3 font-semibold">Add a program</h2>
        <NewProgramForm />
      </div>
    </div>
  );
}
