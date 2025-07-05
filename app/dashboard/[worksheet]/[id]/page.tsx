"use client";

import { useParams } from "next/navigation";
import { MachineStatsCards } from "@/components/machine-stats-cards";

export default function MachineDashboardPage() {
  const params = useParams<{ worksheet: string; id: string }>();
  const machineName =
    params.id === "_"
      ? decodeURIComponent(params.worksheet).toUpperCase()
      : `${decodeURIComponent(
          params.worksheet
        ).toUpperCase()} ${params.id.toUpperCase()}`;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">{machineName}</h1>
      <MachineStatsCards
        worksheet={params.worksheet.toUpperCase()}
        machine={machineName}
      />
    </div>
  );
}
