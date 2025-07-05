"use client";

import { useParams } from "next/navigation";
import { MachineStatsCards } from "@/components/machine-stats-cards";
import ChartPieLabel from "./pie-chart";
import OverdueTable from "./overdue-table";

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
      <div className="mt-10">
        <h3 className="mb-5 text-2xl font-semibold">Chart and Table</h3>
        <div className="grid grid-cols-2 gap-10">
          <ChartPieLabel />
          <OverdueTable />
        </div>
      </div>
    </div>
  );
}
