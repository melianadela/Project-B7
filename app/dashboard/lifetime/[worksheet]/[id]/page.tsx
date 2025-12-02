// app/dashboard/kanban/machine/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MachineStatsCards,
  PieChartDistribution,
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

export default function MachineDashboardPage() {
  const params = useParams<{ worksheet: string; id: string }>();

  const worksheetName = decodeURIComponent(params?.worksheet || "LIFETIME")
    .replace(/-/g, " ")
    .toUpperCase();

  let machineName = "ALL";

  if (params?.id && params.id !== "_") {
    const machinePart = decodeURIComponent(params.id)
      .replace(/-/g, " ")
      .toUpperCase();

    // kalau worksheet-nya MIXING TANK, maka jangan gabungin
    if (worksheetName === "MIXING TANK" || worksheetName === "PURIFIED WATER (PW)" || worksheetName === "AHU") {
      machineName = machinePart;
    } else {
      machineName = `${worksheetName} ${machinePart}`;
    }
  } else {
    machineName = worksheetName;
  }

  const { data: allSpareparts } = useSheetData({
    worksheet: worksheetName,
    machine: machineName,
  });

  const [sparepartDistribution, setSparepartDistribution] = useState<Distribution[]>([]);
  const [overdueSpareparts, setOverdueSpareparts] = useState<Sparepart[]>([]);
  const [nearEndOfLife, setNearEndOfLife] = useState<Sparepart[]>([]);
  const [okSpareparts, setOkSpareparts] = useState<Sparepart[]>([]);
  const [machineSpareparts, setMachineSpareparts] = useState<Sparepart[]>([]);

  useEffect(() => {
  if (!allSpareparts) return;
  const spareparts = allSpareparts as Sparepart[];

  console.log("🔍 Data Spare parts:", spareparts.map(sp => sp.status));

  const overdue = spareparts.filter((sp) => {
    const s = sp.status?.toLowerCase() || "";
    return (
      s.includes("melewati jadwal penggantian") ||
      s.includes("melewati jadwal pelumasan") ||
      s.includes("melewati jadwal pengecekan")
    );
  });

  const expiring = spareparts.filter((sp) => {
    const s = sp.status?.toLowerCase() || "";
    return (
      s.includes("segera jadwalkan penggantian") ||
      s.includes("segera jadwalkan pelumasan") ||
      s.includes("segera jadwalkan pengecekan")
    );
  });

  const ok = spareparts.filter((sp) => {
    const s = sp.status?.toLowerCase() || "";
    return (
      s !== "" &&
      !s.includes("segera jadwalkan") &&
      !s.includes("melewati jadwal")
    );
  });

  console.log("Overdue:", overdue.length, "Expiring:", expiring.length, "OK:", ok.length);

  setOverdueSpareparts(overdue);
  setNearEndOfLife(expiring);
  setOkSpareparts(ok);
  setMachineSpareparts(spareparts);

  setSparepartDistribution([
    { name: "Spare part yang akan habis umur", value: expiring.length },
    { name: "Spare part overdue", value: overdue.length },
    { name: "Spare part OK", value: ok.length },
  ]);
}, [allSpareparts]);
  
// --- 4️⃣ Tampilan khusus GENSET (adaptif light/dark)
const normalized = machineName.toLowerCase().trim();
if (normalized.includes("genset")) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[80vh] text-center px-8 
                 transition-colors duration-300
                 bg-gradient-to-br from-[#f8fbff] via-[#e3f2fa] to-[#c6e4f3]
                 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#334155]"
    >
      <h1
        className="text-5xl font-extrabold mb-4 drop-shadow-sm
                   text-blue-700 dark:text-blue-400"
      >
        ⚡ GENSET STATUS MONITORING
      </h1>

      <p
        className="text-2xl font-semibold
                   text-gray-700 dark:text-gray-200"
      >
        Mesin Ini Tidak Memiliki Part Time-Based
      </p>
    </div>
  );
}

  return (
    <div className="flex flex-col gap-14 pt-6">
      <h1 className="text-3xl font-bold">{machineName}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

  {/* LEFT — Summary Cards */}
  <div>
    <MachineStatsCards
      worksheet={worksheetName}
      machine={machineName}
      onTotalClick={(showCb) => showCb(machineSpareparts)}
      onExpiringClick={(showCb) => showCb(nearEndOfLife)}
      onOverdueClick={(showCb) => showCb(overdueSpareparts)}
      onOkClick={(showCb) => showCb(okSpareparts)}
    />
  </div>

  {/* RIGHT — Pie Chart */}
  <div className="flex items-center justify-center">
    <PieChartDistribution data={sparepartDistribution} />
  </div>
</div>

    </div>
  );
}
