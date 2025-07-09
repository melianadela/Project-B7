"use client";

import { useParams } from "next/navigation";
import {
  MachineStatsCards,
  PieChartDistribution,
  OverdueTable,
  SparepartTable,
} from "@/components/machine-details";
import { useSheetData } from "@/hooks/use-sheet-data";
import { useEffect, useState } from "react";

interface Sparepart {
  mesin: string;
  kodepart: string;
  part: string;
  qty: string;
  category: string;
  penggantianterakhir: string;
  "lifetime(bulan)": string;
  penggantianselanjutnya: string;
  status: string;
  tanggungjawab: string;
}

interface Distribution {
  name: string;
  value: number;
}

export default function MachineDashboardPage() {
  const params = useParams<{ worksheet: string; id: string }>();
  const worksheetName = params.worksheet.toUpperCase();
  const machineName =
    params.id === "_"
      ? decodeURIComponent(worksheetName)
      : `${decodeURIComponent(worksheetName)} ${params.id.toUpperCase()}`;

  const { data: allSpareparts } = useSheetData({
    worksheet: worksheetName,
    machine: machineName.split(" ")[1],
  });

  const [sparepartDistribution, setSparepartDistribution] = useState<
    Distribution[]
  >([]);
  const [overdueSpareparts, setOverdueSpareparts] = useState<Sparepart[]>([]);
  const [machineSpareparts, setMachineSpareparts] = useState<Sparepart[]>([]);

  useEffect(() => {
    if (allSpareparts) {
      const spareparts: Sparepart[] = allSpareparts;

      // Filter dengan kriteria yang sama seperti di MachineStatsCards
      const overdue = spareparts.filter(
        (sp) => sp.status === "Melewati Jadwal Penggantian"
      );
      const nearEndOfLife = spareparts.filter(
        (sp) => sp.status === "Segera Jadwalkan Penggantian"
      );
      const ok = spareparts.filter(
        (sp) =>
          sp.status !== "Segera Jadwalkan Penggantian" &&
          sp.status !== "Melewati Jadwal Penggantian" &&
          sp.status !== ""
      );

      setOverdueSpareparts(overdue);
      setMachineSpareparts(spareparts);

      setSparepartDistribution([
        { name: "Sparepart yang akan habis umur", value: nearEndOfLife.length },
        { name: "Sparepart overdue", value: overdue.length },
        { name: "Sparepart OK", value: ok.length },
      ]);
    }
  }, [allSpareparts]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">{machineName}</h1>
      <MachineStatsCards worksheet={worksheetName} machine={machineName} />
      <div className="mt-10">
        <h3 className="mb-5 text-2xl font-semibold">
          Distribution & Overdue Spareparts
        </h3>
        <div className="grid grid-cols-2 gap-10">
          <PieChartDistribution data={sparepartDistribution} />
          <OverdueTable data={overdueSpareparts} />
        </div>
      </div>
      <div className="mt-10 mb-20">
        <h3 className="mb-5 text-2xl font-semibold">
          Sparepart Lifetime Table
        </h3>
        <SparepartTable data={machineSpareparts} />
      </div>
    </div>
  );
}
