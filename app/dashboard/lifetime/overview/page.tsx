"use client";

import React, { useEffect, useState } from "react";
import { SparepartTable } from "@/components/machine-details";
import { useSheetData } from "@/hooks/use-sheet-data";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieLabelRenderProps,
} from "recharts";

// ================== INTERFACES ==================
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
  key: "overdue" | "nearend" | "ok";
  name: string;
  value: number;
  color: string;
}

// ================== COMPONENT ==================
const LifetimeOverviewPage: React.FC = () => {
  // ✅ ambil data tiap mesin
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
  const [filteredData, setFilteredData] = useState<Sparepart[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "overdue" | "nearend" | "ok">("all");

  // 🎨 map warna gradient → solid (untuk chart)
  const renderLabel = ({ name, percent }: any) => {
    return `${name} (${((percent ?? 0) * 100).toFixed(1)}%)`;
  };
  const colorMap: Record<string, string> = {
    "from-red-500 to-red-700": "#ef4444ff", // merah
    "from-yellow-400 to-amber-500": "#facc15", // kuning
    "from-green-500 to-emerald-600": "#22c55e", // hijau
  };

  useEffect(() => {
    // gabung semua data
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

      const overdue = combined.filter((sp) => sp.status === "Melewati Jadwal Penggantian");
      const nearEndOfLife = combined.filter((sp) => sp.status === "Segera Jadwalkan Penggantian");
      const ok = combined.filter(
        (sp) =>
          sp.status !== "Segera Jadwalkan Penggantian" &&
          sp.status !== "Melewati Jadwal Penggantian" &&
          sp.status !== ""
      );

      setDistribution([
        { key: "overdue", name: "Sparepart Overdue", value: overdue.length, color: "from-red-500 to-red-700" },
        { key: "nearend", name: "Sparepart Akan Habis Umur", value: nearEndOfLife.length, color: "from-yellow-400 to-amber-500" },
        { key: "ok", name: "Sparepart OK", value: ok.length, color: "from-green-500 to-emerald-600" },
      ]);

      // default tampilkan all
      setFilteredData(combined);
    }
  }, [ilapak.data, sig.data, unifill.data, chimei.data, jinsung.data, jihcheng.data, cosmec.data, fbd.data]);

  // fungsi filter dari card
  const handleFilter = (tab: "all" | "overdue" | "nearend" | "ok") => {
    setActiveTab(tab);

    if (tab === "all") {
      setFilteredData(allSpareparts);
    } else if (tab === "overdue") {
      setFilteredData(allSpareparts.filter((sp) => sp.status === "Melewati Jadwal Penggantian"));
    } else if (tab === "nearend") {
      setFilteredData(allSpareparts.filter((sp) => sp.status === "Segera Jadwalkan Penggantian"));
    } else if (tab === "ok") {
      setFilteredData(
        allSpareparts.filter(
          (sp) =>
            sp.status !== "Segera Jadwalkan Penggantian" &&
            sp.status !== "Melewati Jadwal Penggantian" &&
            sp.status !== ""
        )
      );
    }
  };

  // mapping subtitle tabel biar dinamis
  const tableSubtitle: Record<string, string> = {
    all: "Daftar seluruh sparepart",
    overdue: "Daftar sparepart overdue",
    nearend: "Daftar sparepart akan habis umur",
    ok: "Daftar sparepart OK",
  };

  return (
    <div className="mb-12">
      {/* HEADER */}
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
        📊 Lifetime Overview
      </h1>
      <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
        Ringkasan kondisi sparepart untuk seluruh mesin
      </p>
      <div className="mt-4 h-1 w-500 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>

      {/* RINGKASAN CARDS */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card Semua → reset filter */}
        <div
          onClick={() => handleFilter("all")}
          className={`cursor-pointer p-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 
            bg-gradient-to-br from-sky-500 to-blue-600 
            ${activeTab === "all" ? "ring-4 ring-offset-2 ring-blue-400" : ""}`}
        >
          <h4 className="text-lg font-semibold text-white">Semua Sparepart</h4>
          <p className="mt-2 text-3xl font-bold text-white">{allSpareparts.length}</p>
        </div>

        {/* Cards distribusi (overdue, nearend, ok) */}
        {distribution.map((item) => (
          <div
            key={item.key}
            onClick={() => handleFilter(item.key)}
            className={`cursor-pointer p-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 
              bg-gradient-to-br ${item.color} 
              ${activeTab === item.key ? "ring-4 ring-offset-2 ring-blue-400" : ""}`}
          >
            <h4 className="text-lg font-semibold text-white">{item.name}</h4>
            <p className="mt-2 text-3xl font-bold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      {/* DISTRIBUTION CHART */}
      <div className="mt-10">
        <h3 className="mb-5 text-2xl font-semibold text-gray-900 dark:text-white">
          Distribution (All Machines)
        </h3>
        <div className="w-full h-96">
          <ResponsiveContainer>
            <PieChart>
              <Pie
  data={distribution.map((item) => ({
    name: item.name,
    value: item.value,
    color: colorMap[item.color] || "#6b7280",
  }))}
  dataKey="value"
  nameKey="name"
  outerRadius={120}
  label={renderLabel}   // ✅ sekarang aman
>

  {distribution.map((item, index) => (
    <Cell
      key={`cell-${index}`}
      fill={colorMap[item.color] || "#6b7280"}
    />
  ))}
</Pie>
              <Tooltip formatter={(value: number) => [`${value} Sparepart`, "Jumlah"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLE */}
      <div className="mt-12 mb-20">
        <h3 className="mb-1 text-2xl font-semibold text-gray-900 dark:text-white">
          Sparepart Lifetime Table
        </h3>
        <p className="mb-5 text-sm text-gray-500">{tableSubtitle[activeTab]}</p>
        <SparepartTable data={filteredData} showMachine worksheet="LIFETIME_OVERVIEW" />
      </div>
    </div>
  );
};

export default LifetimeOverviewPage;
