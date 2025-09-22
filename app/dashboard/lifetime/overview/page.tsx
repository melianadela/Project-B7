"use client";

import { useEffect, useState } from "react";
import {
  MachineStatsCards,
  PieChartDistribution,
  OverdueTable,
  SparepartTable,
} from "@/components/machine-details";
import { useSheetData } from "@/hooks/use-sheet-data";

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

const WORKSHEETS = [
  "ILAPAK",
  "SIG",
  "UNIFILL",
  "CHIMEI",
  "JINSUNG",
  "JIHCHENG",
  "COSMEC",
  "FBD",
];

export default function LifetimeOverviewPage() {
  // ✅ panggil hook satu per satu di luar loop
  const sheetDataArray = WORKSHEETS.map((ws) =>
    useSheetData({ worksheet: ws, machine: "" })
  );

  const [allSpareparts, setAllSpareparts] = useState<Sparepart[]>([]);
  const [distribution, setDistribution] = useState<Distribution[]>([]);
  const [overdueSpareparts, setOverdueSpareparts] = useState<Sparepart[]>([]);

  useEffect(() => {
    const combined: Sparepart[] = sheetDataArray
      .map((sd) => sd.data || [])
      .flat() as Sparepart[];

    if (combined.length > 0) {
      setAllSpareparts(combined);

      const overdue = combined.filter(
        (sp) => sp.status === "Melewati Jadwal Penggantian"
      );
      const nearEndOfLife = combined.filter(
        (sp) => sp.status === "Segera Jadwalkan Penggantian"
      );
      const ok = combined.filter(
        (sp) =>
          sp.status !== "Segera Jadwalkan Penggantian" &&
          sp.status !== "Melewati Jadwal Penggantian" &&
          sp.status !== ""
      );

      setOverdueSpareparts(overdue);
      setDistribution([
        { name: "Sparepart yang akan habis umur", value: nearEndOfLife.length },
        { name: "Sparepart overdue", value: overdue.length },
        { name: "Sparepart OK", value: ok.length },
      ]);
    }
  }, [sheetDataArray.map((sd) => sd.data).join("|")]); // aman, biar ke-trigger kalau ada perubahan

  return (
    <div className="mb-8">
      <h1 className="text-4xl font-extrabold tracking-tight text-white">
        📊 Lifetime Overview
      </h1>
      <p className="mt-2 text-lg text-gray-400">
        Ringkasan kondisi sparepart untuk seluruh mesin
      </p>
      <div className="mt-4 h-1 w-350 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>

      {/* Distribution & Overdue */}
      <div className="mt-10">
        <h3 className="mb-5 text-2xl font-semibold">
          Distribution & Overdue Spareparts (All Machines)
        </h3>
        <div className="grid grid-cols-2 gap-10">
          <PieChartDistribution data={distribution} />
          <OverdueTable data={overdueSpareparts} />
        </div>
      </div>

      {/* Sparepart Table */}
      <div className="mt-10 mb-20">
        <h3 className="mb-5 text-2xl font-semibold">
          Sparepart Lifetime Table (All Machines)
        </h3>
        <SparepartTable data={allSpareparts} />
      </div>
    </div>
  );
}
