"use client";

import {
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

export default function LifetimeOverviewPage() {
  // ✅ panggil hook satu-satu
  const ilapak = useSheetData({ worksheet: "ILAPAK", machine: "ILAPAK" });
  const sig = useSheetData({ worksheet: "SIG", machine: "SIG" });
  const unifill = useSheetData({ worksheet: "UNIFILL", machine: "UNIFILL" });
  const chimei = useSheetData({ worksheet: "CHIMEI", machine: "CHIMEI" });
  const jinsung = useSheetData({ worksheet: "JINSUNG", machine: "JINSUNG" });
  const jihcheng = useSheetData({ worksheet: "JIHCHENG", machine: "JIHCHENG" });
  const cosmec = useSheetData({ worksheet: "COSMEC", machine: "COSMEC" });
  const fbd = useSheetData({ worksheet: "FBD", machine: "FBD" });

  const [allSpareparts, setAllSpareparts] = useState<Sparepart[]>([]);
  const [distribution, setDistribution] = useState<Distribution[]>([]);
  const [overdueSpareparts, setOverdueSpareparts] = useState<Sparepart[]>([]);

  useEffect(() => {
    // gabung semua data, tambahin nama mesin biar tampil
    const combined: Sparepart[] = [
      ...(ilapak.data || []).map((d: any) => ({ ...d, mesin: "ILAPAK" })),
      ...(sig.data || []).map((d: any) => ({ ...d, mesin: "SIG" })),
      ...(unifill.data || []).map((d: any) => ({ ...d, mesin: "UNIFILL" })),
      ...(chimei.data || []).map((d: any) => ({ ...d, mesin: "CHIMEI" })),
      ...(jinsung.data || []).map((d: any) => ({ ...d, mesin: "JINSUNG" })),
      ...(jihcheng.data || []).map((d: any) => ({ ...d, mesin: "JIHCHENG" })),
      ...(cosmec.data || []).map((d: any) => ({ ...d, mesin: "COSMEC" })),
      ...(fbd.data || []).map((d: any) => ({ ...d, mesin: "FBD" })),
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
  ]);

  return (
    <div className="mb-8">
      <h1 className="text-4xl font-extrabold tracking-tight text-white">
        📊 Lifetime Overview
      </h1>
      <p className="mt-2 text-lg text-gray-400">
        Ringkasan kondisi sparepart untuk seluruh mesin
      </p>
      <div className="mt-4 h-1 w-350 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>

      <div className="mt-10">
        <h3 className="mb-5 text-2xl font-semibold">
          Distribution & Overdue Spareparts (All Machines)
        </h3>
        <div className="grid grid-cols-2 gap-10">
          <PieChartDistribution data={distribution} />
          <OverdueTable data={overdueSpareparts} showMachine />
        </div>
      </div>

      <div className="mt-10 mb-20">
        <h3 className="mb-5 text-2xl font-semibold">
          Sparepart Lifetime Table (All Machines)
        </h3>
        <SparepartTable data={allSpareparts} showMachine />
      </div>
    </div>
  );
}
