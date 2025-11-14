"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Row {
  tanggal?: string;
  kodepart?: string;
  part?: string;
  mesin?: string;
  qty_pemakaian?: string;
}

export default function PemakaianPage() {
  const [data, setData] = useState<Row[]>([]);
  const [bulanList, setBulanList] = useState<string[]>([]);
  const [bulan, setBulan] = useState<string>("");
  const [filtered, setFiltered] = useState<Row[]>([]);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  async function load() {
    try {
      const res = await fetch("/api/pemakaian", { cache: "no-store" });
      const json = await res.json();

      const rows: Row[] = Array.isArray(json.data) ? json.data : [];

      const months = Array.from(
        new Set(
          rows
            .map((r) => (r.tanggal ? r.tanggal.substring(0, 7) : ""))
            .filter(Boolean)
        )
      );

      setData(rows);
      setBulanList(months);

      if (months.length > 0) {
        setBulan(months[0]);
        setFiltered(rows.filter((r) => r.tanggal?.startsWith(months[0])));
      }

      setLoading(false);
    } catch (err) {
      console.error("Gagal mengambil data:", err);
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // -----------------------------
  // 🔍 FITUR SEARCH
  // -----------------------------
  const filteredSearch = filtered.filter((row) => {
    const s = search.toLowerCase();
    return (
      row.kodepart?.toLowerCase().includes(s) ||
      row.part?.toLowerCase().includes(s) ||
      row.mesin?.toLowerCase().includes(s)
    );
  });

  // -----------------------------
  // 📄 EXPORT PDF
  // -----------------------------
  const exportPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "A4"
    });

    doc.setFontSize(16);
    doc.text("Laporan Pemakaian Kanban Eksternal", 40, 40);
    doc.setFontSize(12);
    doc.text(`Periode: ${bulan}`, 40, 60);

    autoTable(doc, {
      head: [["Kode Part", "Nama Part", "Mesin", "Qty"]],
      body: filteredSearch.map((r) => [
        r.kodepart ?? "",
        r.part ?? "",
        r.mesin ?? "",
        r.qty_pemakaian ?? ""
      ]),
      startY: 80,
      styles: { fontSize: 9 }
    });

    doc.save(`Pemakaian_${bulan}.pdf`);
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-lg opacity-60">
        Loading data...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold tracking-tight"
      >
        Pemakaian Kanban Eksternal
      </motion.h1>

      {/* FILTER */}
      <Card className="p-4">
        <div className="flex items-center gap-4 overflow-visible">
          <span className="font-semibold">Pilih Bulan:</span>

          <Select
            value={bulan}
            onValueChange={(v: string) => {
              setBulan(v);
              setFiltered(data.filter((r) => r.tanggal?.startsWith(v)));
            }}
          >
            <SelectTrigger className="w-[360px] min-w-[360px] whitespace-nowrap max-w-none">
              <SelectValue placeholder="Pilih Bulan" />
            </SelectTrigger>

            <SelectContent className="min-w-[360px] !overflow-visible">
              {bulanList.map((b) => (
                <SelectItem
                  key={b}
                  value={b}
                  className="whitespace-nowrap max-w-none !overflow-visible"
                >
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm opacity-70">Total Item</p>
          <p className="text-3xl font-bold">{filteredSearch.length}</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm opacity-70">Total Qty</p>
          <p className="text-3xl font-bold">
            {filteredSearch.reduce(
              (sum, r) => sum + Number(r.qty_pemakaian || 0),
              0
            )}
          </p>
        </Card>
      </div>

      {/* SEARCH + EXPORT */}
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Cari kode part / nama part / mesin..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded-md w-72"
        />

        <button
          onClick={exportPDF}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Export PDF
        </button>
      </div>
      
      {/* TABLE */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-y-auto max-h-[450px]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800/70 backdrop-blur">
                <tr>
                  <th className="p-3 border text-center">Kode Part</th>
                  <th className="p-3 border text-center">Nama Part</th>
                  <th className="p-3 border text-center">Mesin</th>
                  <th className="p-3 border text-center">Qty</th>
                </tr>
              </thead>

              <tbody>
                {filteredSearch.map((row, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-200 dark:hover:bg-gray-800 transition cursor-pointer"
                  >
                    <td className="p-3 border text-center">{row.kodepart}</td>
                    <td className="p-3 border">{row.part}</td>
                    <td className="p-3 border text-center">{row.mesin}</td>
                    <td className="p-3 border text-center">{row.qty_pemakaian}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
