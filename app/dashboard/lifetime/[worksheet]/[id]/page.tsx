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

  // === Tampilan khusus untuk GENSET ===
  const normalized = (machineName || "").toLowerCase().trim();
  if (normalized.includes("genset")) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[80vh] text-center px-8"
        style={{
          background: "linear-gradient(135deg, #f8fbff 0%, #e3f2fa 50%, #c6e4f3 100%)",
          color: "#1D2C8A",
        }}
      >
        <h1 className="text-5xl font-extrabold mb-4 text-blue-700 drop-shadow-sm">
          ⚡GENSET STATUS MONITORING
        </h1>
        <p className="text-2xl text-gray-700 max-w-2xl leading-relaxed font-semibold">
          Mesin Ini Tidak Memiliki Part Time-Based
        </p>
      </div>
    );
  }

  console.log("worksheet:", worksheetName);
  console.log("machine:", machineName);

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
        <h3 className="mb-5 text-2xl font-semibold">Distribution Spare parts</h3>
        <div className="flex justify-center">
          <PieChartDistribution data={sparepartDistribution} />
        </div>
      </div>
    </div>
  );
}
