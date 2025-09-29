// app/dashboard/kanban/machine/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MachineStatsCards,
  PieChartDistribution,
  OverdueTable,
  SparepartTable,
} from "@/components/machine-details";
import { useSheetData } from "@/hooks/use-sheet-data";

/**
 * Page: Machine Dashboard
 * - memanggil MachineStatsCards dengan handler onXClick
 * - menampilkan modal saat card diklik (modal di-handle di machine-details.tsx sekarang via prop)
 */

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
  const worksheetName = (params?.worksheet || "LIFETIME").toUpperCase();
  const machineName =
    params?.id === "_" || !params?.id
      ? decodeURIComponent(worksheetName)
      : `${decodeURIComponent(worksheetName)} ${params.id.toUpperCase()}`;

  // ambil data via hook (pastikan hook useSheetData mengembalikan { data })
  const { data: allSpareparts } = useSheetData({
    worksheet: worksheetName,
    machine: machineName.split(" ")[1] ?? "ALL",
  });

  const [sparepartDistribution, setSparepartDistribution] = useState<Distribution[]>([]);
  const [overdueSpareparts, setOverdueSpareparts] = useState<Sparepart[]>([]);
  const [nearEndOfLife, setNearEndOfLife] = useState<Sparepart[]>([]);
  const [okSpareparts, setOkSpareparts] = useState<Sparepart[]>([]);
  const [machineSpareparts, setMachineSpareparts] = useState<Sparepart[]>([]);

  useEffect(() => {
    if (!allSpareparts) return;
    const spareparts = allSpareparts as Sparepart[];

    const overdue = spareparts.filter((sp) => sp.status === "Melewati Jadwal Penggantian");
    const expiring = spareparts.filter((sp) => sp.status === "Segera Jadwalkan Penggantian");
    const ok = spareparts.filter(
      (sp) =>
        sp.status !== "Segera Jadwalkan Penggantian" &&
        sp.status !== "Melewati Jadwal Penggantian" &&
        sp.status !== ""
    );

    setOverdueSpareparts(overdue);
    setNearEndOfLife(expiring);
    setOkSpareparts(ok);
    setMachineSpareparts(spareparts);

    setSparepartDistribution([
      { name: "Sparepart yang akan habis umur", value: expiring.length },
      { name: "Sparepart overdue", value: overdue.length },
      { name: "Sparepart OK", value: ok.length },
    ]);
  }, [allSpareparts]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">{machineName}</h1>

      <MachineStatsCards
        worksheet={worksheetName}
        machine={machineName}
        // pass handlers yang akan menampilkan modal (modal dikelola internal di komponen)
        onTotalClick={(showCb) => showCb(machineSpareparts)}
        onExpiringClick={(showCb) => showCb(nearEndOfLife)}
        onOverdueClick={(showCb) => showCb(overdueSpareparts)}
        onOkClick={(showCb) => showCb(okSpareparts)}
      />

      <div className="mt-10">
        <h3 className="mb-5 text-2xl font-semibold">Distribution Spareparts</h3>
        <div className="flex justify-center">
          <PieChartDistribution data={sparepartDistribution} />
        </div>
      </div>
    </div>
  );
}
