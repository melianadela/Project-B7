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
  const temach = useSheetData({ worksheet: "TEMACH", machine: "TEMACH" });
  const supermixer = useSheetData({ worksheet: "SUPER MIXER", machine: "SUPER MIXER" });
  const mixing = useSheetData({ worksheet: "MIXING TANK", machine: "MIXING TANK" });
  const storage = useSheetData({ worksheet: "STORAGE TANK", machine: "STORAGE TANK" });
  const aquademin = useSheetData({ worksheet: "AQUADEMIN", machine: "AQUADEMIN" });
  const deminpanas = useSheetData({ worksheet: "DEMIN PANAS", machine: "DEMIN PANAS" });
  const boiler = useSheetData({ worksheet: "BOILER", machine: "BOILER" });
  const genset = useSheetData({ worksheet: "GENSET", machine: "GENSET" });
  const chiller = useSheetData({ worksheet: "CHILLER", machine: "CHILLER" });
  const kompressor = useSheetData({ worksheet: "KOMPRESSOR", machine: "KOMPRESSOR" });
  const pw = useSheetData({ worksheet: "PURIFIED WATER (PW)", machine: "PURIFIED WATER (PW)" });
  const ahu = useSheetData({ worksheet: "AHU", machine: "AHU" });


  const [allSpareparts, setAllSpareparts] = useState<Sparepart[]>([]);
  const [distribution, setDistribution] = useState<Distribution[]>([]);
  const [filteredData, setFilteredData] = useState<Sparepart[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "overdue" | "nearend" | "ok">("all");

  // 🎨 map warna gradient → solid (untuk chart)
  const renderLabel = ({ name, percent }: any) => {
    return `${name} (${((percent ?? 0) * 100).toFixed(1)}%)`;
  };
  const colorMap: Record<string, string> = {
    "from-red-500 to-red-700": "#e42b2bff", // merah
    "from-yellow-400 to-amber-500": "#f5ff34ff", // kuning
    "from-green-500 to-emerald-600": "#11f611ff", // hijau
  };

  useEffect(() => {
    const sheetGroups = [
      { data: ilapak.data, mesin: "ILAPAK" },
      { data: sig.data, mesin: "SIG" },
      { data: unifill.data, mesin: "UNIFILL" },
      { data: chimei.data, mesin: "CHIMEI" },
      { data: jinsung.data, mesin: "JINSUNG" },
      { data: jihcheng.data, mesin: "JIHCHENG" },
      { data: cosmec.data, mesin: "COSMEC" },
      { data: fbd.data, mesin: "FBD" },
      { data: temach.data, mesin: "TEMACH" },
      { data: supermixer.data, mesin: "SUPER MIXER" },
      { data: mixing.data, mesin: "MIXING TANK" },
      { data: storage.data, mesin: "STORAGE TANK" },
      { data: aquademin.data, mesin: "AQUADEMIN" },
      { data: deminpanas.data, mesin: "DEMIN PANAS" },
      { data: boiler.data, mesin: "BOILER" },
      { data: genset.data, mesin: "GENSET" },
      { data: chiller.data, mesin: "CHILLER" },
      { data: kompressor.data, mesin: "KOMPRESSOR" },
      { data: pw.data, mesin: "PURIFIED WATER (PW)" },
      { data: ahu.data, mesin: "AHU" },
    ];

    // Tunggu sampai semua data selesai diambil
    const allLoaded = sheetGroups.every((g) => Array.isArray(g.data));
    if (!allLoaded) return;

    // Gabungkan semua sheet
    const combined: Sparepart[] = sheetGroups.flatMap(({ data, mesin }) =>
      (data || []).map((d: any) => ({
        ...d,
        mesin,
        // 🧠 handle kalau ada submachine (contoh: MIXING TANK → SILVERSON, TETRA)
        mesinfull:
          mesin === "MIXING TANK"
            ? d.mesin || "SILVERSON/TETRA"
            : d.mesin || mesin,
      }))
    );

    // Simpan semua ke state
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
      { key: "overdue", name: "Spare part Overdue", value: overdue.length, color: "from-red-500 to-red-700" },
      { key: "nearend", name: "Spare part Akan Habis Umur", value: nearEndOfLife.length, color: "from-yellow-400 to-amber-500" },
      { key: "ok", name: "Spare part OK", value: ok.length, color: "from-green-500 to-emerald-600" },
    ]);

    setFilteredData(combined);
  }, [
    ilapak.data,
    sig.data,
    unifill.data,
    chimei.data,
    jinsung.data,
    jihcheng.data,
    cosmec.data,
    fbd.data,
    temach.data,
    supermixer.data,
    mixing.data,
    storage.data,
    aquademin.data,
    deminpanas.data,
    boiler.data,
    genset.data,
    chiller.data,
    kompressor.data,
    pw.data,
    ahu.data,
  ]);

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
    all: "Daftar seluruh spare part",
    overdue: "Daftar spare part overdue",
    nearend: "Daftar spare part akan habis umur",
    ok: "Daftar spare part OK",
  };

  return (
    <div className="mb-12">
      {/* HEADER */}
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
        📊 Lifetime Overview
      </h1>
      <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
        Ringkasan kondisi spare part untuk seluruh mesin
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
          <h4 className="text-lg font-semibold text-white">Semua Spare part</h4>
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
                innerRadius={70}       
                outerRadius={140}
                paddingAngle={3}
              >
                {distribution.map((item, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colorMap[item.color] || "#6b7280"}
                  />
                ))}
              </Pie>

              {/* 🔥 Tooltip custom: munculin persentase saat hover */}
              <Tooltip
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null;
                  const entry = payload[0];
                  const total = distribution.reduce((s, d) => s + d.value, 0);
                  const percent = ((entry.value / total) * 100).toFixed(1);

                  return (
                    <div className="bg-white dark:bg-slate-800 text-sm p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="font-semibold">{entry.name}</div>
                      <div>{entry.value} item</div>
                      <div className="text-blue-600 dark:text-blue-400">{percent}%</div>
                    </div>
                  );
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLE */}
      <div className="mt-12 mb-20">
        <h3 className="mb-1 text-2xl font-semibold text-gray-900 dark:text-white">
          Spare part Lifetime Table
        </h3>
        <p className="mb-5 text-sm text-gray-500">{tableSubtitle[activeTab]}</p>
        <SparepartTable data={filteredData} showMachine worksheet="LIFETIME_OVERVIEW" />
      </div>
    </div>
  );
};

export default LifetimeOverviewPage;
