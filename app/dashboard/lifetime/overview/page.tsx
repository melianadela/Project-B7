"use client";

import { useEffect, useState } from "react";
import {
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

export default function LifetimeOverviewPage() {
  // ✅ Panggil hook satu per satu, bukan dalam map()
  const ilapak = useSheetData({ worksheet: "ILAPAK", machine: "" });
  const sig = useSheetData({ worksheet: "SIG", machine: "" });
  const unifill = useSheetData({ worksheet: "UNIFILL", machine: "" });
  const chimei = useSheetData({ worksheet: "CHIMEI", machine: "" });
  const jinsung = useSheetData({ worksheet: "JINSUNG", machine: "" });
  const jihcheng = useSheetData({ worksheet: "JIHCHENG", machine: "" });
  const cosmec = useSheetData({ worksheet: "COSMEC", machine: "" });
  const fbd = useSheetData({ worksheet: "FBD", machine: "" });

  const [allSpareparts, setAllSpareparts] = useState<Sparepart[]>([]);
  const [distribution, setDistribution] = useState<Distribution[]>([]);
  const [overdueSpareparts, setOverdueSpareparts] = useState<Sparepart[]>([]);

  useEffect(() => {
    const combined: Sparepart[] = [
      ...(ilapak.data || []),
      ...(sig.data || []),
      ...(unifill.data || []),
      ...(chimei.data || []),
      ...(jinsung.data || []),
      ...(jihcheng.data || []),
      ...(cosmec.data || []),
      ...(fbd.data || []),
    ];

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
  }, [
    ilapak.data,
    sig.data,
    unifill.data,
    chimei.data,
    jinsung.data,
    jihcheng.data,
    cosmec.data,
    fbd.data,
  ]); // ✅ dependencies jelas

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
