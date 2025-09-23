"use client";

import { useState, useEffect } from "react";
import { useSheetData } from "@/hooks/use-sheet-data";

interface SparepartExternal {
  kodepart: string;
  part: string;
  qty: string;
  deadline: string;
  pic: string;
  status: "Not Started" | "In Progress" | "Completed";
}

export default function KanbanExternalPage() {
  const { data } = useSheetData({
    worksheet: "KANBAN_EKSTERNAL",  // sesuaikan nama worksheet persis
    machine: "",                    // kalau ada filter mesin, sesuaikan
  });
  const [parts, setParts] = useState<SparepartExternal[]>([]);

  // Mapping status di sheet ke status Kanban
  const statusMapping: Record<string, SparepartExternal["status"]> = {
    "Not Started": "Not Started",
    "In Progress": "In Progress",
    "Completed": "Completed",
    // Tambahkan jika di sheet ada status lain seperti "Belum Mulai", "Dalam Proses", dsb
    "Belum Dimulai": "Not Started",
    "Sedang Berjalan": "In Progress",
    "Selesai": "Completed",
  };

  useEffect(() => {
    if (data && data.length > 0) {
      const mapped = data.map((row: any) => ({
        kodepart: row["Kode Part"] || row.kodepart || "-",
        part: row["Part"] || row.part || "-",
        qty: row["Qty kebutuhan selanjutnya"]?.toString() || row.qty || "0",
        deadline: row["Deadline Pemesanan"] || row.penggantianselanjutnya || "-",
        pic: row["Tanggung Jawab"] || row.tanggungjawab || "-",
        status: statusMapping[row["Status"]]?.toString() as SparepartExternal["status"] 
                 || "Not Started",
      }));
      setParts(mapped);
    }
  }, [data]);

  const columns: SparepartExternal["status"][] = ["Not Started", "In Progress", "Completed"];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-blue-600">
        📦 Kanban External
      </h1>

      <div className="grid grid-cols-3 gap-6">
        {columns.map((col) => (
          <div
            key={col}
            className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[70vh] flex flex-col"
          >
            <h2 className="text-xl font-bold mb-4 text-center text-gray-700 dark:text-gray-200">
              {col}
            </h2>

            <div className="flex-1 space-y-4 overflow-y-auto">
              {parts
                .filter((p) => p.status === col)
                .map((p, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 text-sm border border-gray-200 dark:border-gray-600"
                  >
                    <p><span className="font-semibold">Kode:</span> {p.kodepart}</p>
                    <p><span className="font-semibold">Part:</span> {p.part}</p>
                    <p><span className="font-semibold">Qty:</span> {p.qty}</p>
                    <p><span className="font-semibold">Deadline:</span> {p.deadline}</p>
                    <p><span className="font-semibold">PIC:</span> {p.pic}</p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
