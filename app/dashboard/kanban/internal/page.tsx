"use client";

import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Printer, FileText, Loader2 } from "lucide-react";

// --- Sesuaikan import komponen UI dengan projectmu (shadcn/ui) ---
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ----- Types -----
interface KanbanRow {
  __sheetRow?: number;
  kodepart?: string;
  kode_part?: string;
  part?: string;
  Part?: string;
  quantity?: string | number;
  qty?: string | number;
  uom?: string;
  UOM?: string;
  vendor?: string;
  supplier?: string;
  PR?: string;
  pr?: string;
  no_pr?: string;
  noPr?: string;
  status?: string;
  status_pemesanan?: string;
  deadline_pemesanan?: string;
  kanbanStatus?: string;
  kebutuhan_per_tahun?: string;
  safety_stock?: string;
  total_kebutuhan?: string;
  on_hand_inventory?: string;
  tanggal_receipt?: string;
  no_receipt?: string;
  [key: string]: any;
}

// ----- Helpers -----
function getKanbanStatusFromRow(row: KanbanRow) {
  // prefer backend kanbanStatus if available
  if (row.kanbanStatus) return row.kanbanStatus;
  const s = (row.status || row.status_pemesanan || "").toString().toLowerCase();
  if (!s) return "ignore";
  if (s.includes("siap") || s.includes("siapkan") || s.includes("harus") || s.includes("minta"))
    return "not_started";
  if (s.includes("pr") || s.includes("po") || s.includes("diajukan") || s.includes("dibuat"))
    return "in_progress";
  if (s.includes("diterima") || s.includes("selesai") || s.includes("sudah"))
    return "completed";
  return "ignore";
}

// ----- Component -----
export default function KanbanInternalPage() {
  // basic UI state
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<KanbanRow[]>([]);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [tab, setTab] = useState<"board" | "list" | "monitoring">("board");
  const [search, setSearch] = useState("");
  const [showListModal, setShowListModal] = useState<null | "total" | "harusDipesan">(null);
  const [showForm, setShowForm] = useState(false);
  const [formRow, setFormRow] = useState<KanbanRow | null>(null);
  const [formData, setFormData] = useState({
    tanggal: "",
    noPR: "",
    kodePart: "",
    namaPart: "",
    bulan: "",
    qty: "",
    uom: "",
    vendor: "",
    pic: "",
  });
  const [darkMode, setDarkMode] = useState(false);

  // PO form
  const [showPOForm, setShowPOForm] = useState(false);
  const [formPO, setFormPO] = useState({
    noPO: "",
    tanggalPO: "",
    leadtime: "",
    harga: "",
    eta: "",
  });
  const [rowPO, setRowPO] = useState<KanbanRow | null>(null);

  // Receipt form
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [formReceipt, setFormReceipt] = useState({
    tanggalReceipt: "",
    noReceipt: "",
  });
  const [rowReceipt, setRowReceipt] = useState<KanbanRow | null>(null);

  // Pemakaian form (important: state must be defined top-level)
  const [showPemakaianForm, setShowPemakaianForm] = useState(false);
  const [formPemakaian, setFormPemakaian] = useState({
    tanggal: "",
    tipe_kanban: "INTERNAL",
    kode_part: "",
    part: "",
    qty_pemakaian: "",
    keterangan: "",
    operator: "",
  });

  // UOM options (same as eksternal)
  const uomOptions = [
    "EA", "PCS", "SET", "BOX", "PACK", "LITER", "KG", "M", "CM", "UNIT", "..Others"
  ];

  // fetch data
  async function fetchData() {
    setLoading(true);
    try {
      // important: type=internal so server uses KANBAN_INTERNAL
      const res = await fetch("/api/kanban?type=internal");
      const json = await res.json();
      if (!json.success) {
        console.error("API error:", json);
        setRows([]);
        setLoading(false);
        return;
      }

      const normalized: KanbanRow[] = (json.data || []).map((r: any) => {
        const mapped: KanbanRow = {
          __sheetRow: r.__sheetRow,
          kodepart: r.kode_part ?? r.kodepart ?? r.kode ?? "",
          part: r.part ?? r.Part ?? r.nama_part ?? "",
          quantity: r.kebutuhan_per_tahun ?? r.quantity ?? r.qty ?? r["Qty Order"] ?? "",
          uom: r.uom ?? r.satuan ?? r.UOM ?? "",
          vendor: r.supplier ?? r.vendor ?? r.Supplier ?? "",
          PR: r.PR ?? r.pr ?? r.nopr ?? r.no_pr ?? "",
          noPr: (r.PR ?? r.pr ?? r.nopr ?? r.no_pr ?? "").toString(),
          status: r.status ?? r.Status ?? r.status_pemesanan ?? r.Status_Pemesanan ?? "",
          status_pemesanan: r.status_pemesanan ?? "",
          deadline_pemesanan: r.deadline_pemesanan ?? r.deadline ?? r.Deadline ?? "",
          kanbanStatus: r.kanbanStatus ?? r.kanban_status ?? undefined,

          // internal-specific inventory fields (if any)
          leadtime_hari:r["Leadtime (Hari)"] ?? r.leadtime_hari ?? r.Leadtime ?? "",
          reorder_min:r["Reorder Min"] ?? r.reorder_min ?? r.ReorderMin ?? "",
          reorder_max:r["Reorder Max"] ?? r.reorder_max ?? r.ReorderMax ?? "",
          on_hand_inventory: r.on_hand_inventory ?? r.OnHandInventory ?? r["On Hand Inventory"] ?? "",

          ...r,
          tanggal_receipt: r.tanggal_receipt ?? r.TanggalReceipt ?? "",
          no_receipt: r.no_receipt ?? r.NoReceipt ?? "",
        };
        return mapped;
      });

      // filter header-like rows / empty kodepart
      const filtered = normalized.filter((r) => {
        const k = (r.kodepart || "").toString().trim().toLowerCase();
        if (!k) return false;
        if (["kode part", "kodepart", "kode"].includes(k)) return false;
        return true;
      });

      setRows(filtered);

      console.log("ROWS AFTER FETCH (internal):", filtered.map((r) => ({
        kode: r.kodepart, vendor: r.vendor, status: r.status, kanban: r.kanbanStatus
      })));

    } catch (err) {
      console.error("fetchData error:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // totals
  const totalSparepart = useMemo(() => {
    const s = new Set(rows.map((r) => (r.kodepart || "").trim()).filter(Boolean));
    return s.size;
  }, [rows]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const partHarusDipesan = useMemo(() => {
  return rows.filter(r =>
    ((r.kanbanStatus === "not_started") ||
      (r.status || "").toLowerCase().includes("segera pesan"))
  ).length;
}, [rows]);

  // group by status
  // --- Ambil data tracking dari sheet KANBAN_TRACKING untuk status PR/PO/Receipt ---
const [trackingData, setTrackingData] = useState<KanbanRow[]>([]);

useEffect(() => {
  async function fetchTracking() {
    try {
      const res = await fetch("/api/sheets?worksheet=KANBAN_TRACKING");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTrackingData(json.data);
      }
    } catch (err) {
      console.error("fetchTracking error:", err);
    }
  }
  fetchTracking();
}, []);

// --- Filter internal: ambil semua baris valid dari sheet internal ---
const allInternal = useMemo(() => {
  return rows.filter(r => (r.kodepart || "").trim() !== "" && (r["tipe_kanban"] || "").toLowerCase() === "internal");
}, [rows]);

// --- Cross-check ke sheet KANBAN_TRACKING berdasarkan Kode Part ---
const linkedTracking = useMemo(() => {
  return trackingData.filter(tr => {
    const kodeTrack = (tr["Kode Part"] || tr.kodepart || "").toLowerCase().trim();
    const tipe = (tr["Tipe Kanban"] || tr.tipe_kanban || "").toLowerCase().trim();
    return (
      tipe === "internal" &&
      allInternal.some(internal =>
        (internal.kodepart || "").toLowerCase().trim() === kodeTrack
      )
    );
  });
}, [allInternal, trackingData]);

// --- Group logic: disesuaikan dengan internal ---
const notStarted = useMemo(() => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return rows.filter(r => {
    const status = (r.status || "").toLowerCase();
    const deadline = r.deadline_pemesanan ? new Date(r.deadline_pemesanan) : null;

    const isDueThisMonth = deadline
      ? deadline.getMonth() === currentMonth && deadline.getFullYear() === currentYear
      : false;

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const receiptDate = r.tanggal_receipt ? new Date(r.tanggal_receipt) : null;
    const isOldCompleted = receiptDate && receiptDate < fourteenDaysAgo;

    // tetap tampil kalau waktunya pesan lagi bulan ini (walaupun pernah complete)
    return (
      ((r.kanbanStatus === "not_started") ||
        status.includes("segera pesan") ||
        (status.includes("selesai") && isDueThisMonth)) &&
      !isOldCompleted
    );
  });
}, [rows]);

const inProgress = useMemo(() => {
  return rows.filter(r =>
    (r.tipe_kanban || "").toLowerCase() === "internal" &&
    (r.kanbanStatus === "in_progress" ||
      (r.status || "").toLowerCase().includes("pr") ||
      (r.status || "").toLowerCase().includes("po") ||
      (r.status || "").toLowerCase().includes("diajukan") ||
      (r.status || "").toLowerCase().includes("dibuat"))
  );
}, [rows]);

const completed = useMemo(() => {
  return rows.filter(r =>
    (r.tipe_kanban || "").toLowerCase() === "internal" &&
    (r.kanbanStatus === "completed" ||
      (r.status || "").toLowerCase().includes("selesai") ||
      (r.status || "").toLowerCase().includes("diterima") ||
      (r.status || "").toLowerCase().includes("sudah"))
  );
}, [rows]);

  // filtered rows for list
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.kodepart || "").toLowerCase().includes(q) ||
      (r.part || "").toLowerCase().includes(q) ||
      (r.vendor || "").toLowerCase().includes(q) ||
      (r.status || "").toLowerCase().includes(q) ||
      (r.PR || r.noPr || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  // ----------------- Actions: createPR, updateStatusByPR, updatePO, markReceived -----------------
  async function createPR(r: KanbanRow, noPR?: string) {
    if (!noPR) {
      // open PR form with prefilled values
      setFormRow(r);

      // auto-bulan dari keterangan (attempt)
      const rawKeterangan = (r.keterangan || "").trim();
      const matchBulan = rawKeterangan.match(
        /(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)/i
      );
      const bulanMap: Record<string,string> = {
        Jan: "Januari", Feb: "Februari", Mar: "Maret", Apr: "April", Mei: "Mei", Jun: "Juni",
        Jul: "Juli", Agu: "Agustus", Sep: "September", Okt: "Oktober", Nov: "November", Des: "Desember",
        Januari:"Januari",Februari:"Februari",Maret:"Maret",April:"April",Juni:"Juni",Juli:"Juli",
        Agustus:"Agustus",September:"September",Oktober:"Oktober",November:"November",Desember:"Desember"
      };
      const bulanFull = (matchBulan && bulanMap[matchBulan[0]]?.toString()) || matchBulan?.[0] || "";

      // ambil otomatis dari kolom Qty
      const qtyDefault = r["Qty yang dipesan"] || r.qty || r.qty_yang_dipesan || "";
      // ambil nama bulan dalam format panjang (contoh: "November")
      const bulanDefault = (
        r["Untuk Bulan"] ||
        r.untuk_bulan ||
        (r.deadline_pemesanan
          ? new Date(r.deadline_pemesanan).toLocaleString("id-ID", { month: "long" })
          : new Date().toLocaleString("id-ID", { month: "long" }))
      ).toString().replace(/kebutuhan\s+bulan\s+/i, "").trim();

      setFormData({
        tanggal: new Date().toISOString().slice(0, 10),
        noPR: "",
        kodePart: r.kodepart || "",
        namaPart: r.part || "",
        bulan: bulanDefault,
        qty: String(qtyDefault),
        uom: r.uom || "EA",
        vendor: r.vendor || "",
        pic: "",
      });

      setShowForm(true);
      return;
    }

    setProcessingKey(r.kodepart || r.part || "create");
    try {
      const payload = {
        payload: {
          Tanggal: new Date().toISOString().slice(0,10),
          PR: noPR,
          tanggalpr: new Date().toISOString().slice(0,10),
          "Tipe Kanban": "INTERNAL",
          "Kode Part": r.kodepart,
          Part: r.part,
          "Untuk Bulan": new Date().toLocaleString("default", { month: "long", year: "numeric" }),
          "Qty Order": r.quantity,
          UOM: r.uom,
          Supplier: r.vendor,
          Status: "PR Dibuat",
        }
      };

      const res = await fetch("/api/kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        console.error("create PR failed", json);
        alert("❌ Gagal membuat PR. Cek console.");
      } else {
        setRows(prev => prev.map(row =>
          row.kodepart === r.kodepart
            ? { ...row, noPr: noPR, PR: noPR, status: "PR Dibuat", kanbanStatus: "in_progress" }
            : row
        ));
        await fetchData();
      }
    } catch (err) {
      console.error("createPR error", err);
      alert("❌ Terjadi error saat membuat PR.");
    } finally {
      setProcessingKey(null);
    }
  }

  async function updateStatusByPR(prValue: string, status: string) {
    setProcessingKey(prValue || "update");
    try {
      const payload = { payload: { noPr: prValue, status } };
      const res = await fetch("/api/kanban", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) console.error("update failed", json);
      await fetchData();
    } catch (err) {
      console.error("updateStatus error", err);
    } finally {
      setProcessingKey(null);
    }
  }

  async function updatePO(r: KanbanRow, poNumber: string, tanggalpo: string, eta: string) {
    const prValue = r.noPr || r.PR;
    if (!prValue) {
      alert("PR number not found for this item.");
      return;
    }

    setProcessingKey(prValue);
    try {
      const harga = formPO.harga || "";
      const leadtime = formPO.leadtime || "";

      const payload = {
        payload: {
          noPr: prValue,
          status: "PO Diajukan",
          po: poNumber,
          tanggalpo,
          eta,
          harga,
          leadtime,
        }
      };

      const res = await fetch("/api/kanban", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await res.json();
      await fetchData();
    } catch (err) {
      console.error("updatePO error", err);
    } finally {
      setProcessingKey(null);
    }
  }

  async function markReceived(r: KanbanRow, noReceipt: string, tanggalReceipt: string) {
    const prValue = r.noPr || r.PR;
    if (!prValue) return;
    setProcessingKey(prValue);
    try {
      const payload = {
        payload: {
          noPr: prValue,
          status: "Sudah Diterima",
          tanggalreceipt: tanggalReceipt,
          noreceipt: noReceipt,
        }
      };
      const res = await fetch("/api/kanban", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await res.json();
      await fetchData();
    } finally {
      setProcessingKey(null);
    }
  }

  // ----------------- Submit pemakaian -----------------
  async function submitPemakaian() {
    if (!formPemakaian.tanggal || !formPemakaian.kode_part || !formPemakaian.qty_pemakaian) {
      alert("⚠️ Isi minimal Tanggal, Kode Part, dan Qty Pemakaian!");
      return;
    }
    try {
      const payload = {
        payload: {
          tanggal: formPemakaian.tanggal,
          tipe_kanban: formPemakaian.tipe_kanban,
          kode_part: formPemakaian.kode_part,
          part: formPemakaian.part,
          qty_pemakaian: formPemakaian.qty_pemakaian,
          keterangan: formPemakaian.keterangan,
          operator: formPemakaian.operator,
        },
      };
      const res = await fetch("/api/kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        alert("✅ Data pemakaian berhasil disimpan!");
        setShowPemakaianForm(false);
        setFormPemakaian({
          tanggal: "",
          tipe_kanban: "INTERNAL",
          kode_part: "",
          part: "",
          qty_pemakaian: "",
          keterangan: "",
          operator: "",
        });
        await fetchData();
      } else {
        alert("❌ Gagal simpan ke sheet, cek console.");
        console.error(json);
      }
    } catch (err) {
      console.error("submitPemakaian error", err);
      alert("❌ Error kirim data ke API.");
    }
  }

  // ----------------- Exports -----------------
  const exportExcel = () => {
    const header = [
      "Part", "Kode Part", "Leadtime (Hari)", "Reorder Min", "Reorder Max", "On Hand Inventory", "Vendor"
    ];

    const data = rows.map((row) => [
      row.part || "-",
      row.kodepart || "-",
      row.leadtime_hari || "-",
      row.reorder_min || "-",
      row.reorder_max || "-",
      row.on_hand_inventory || "-",
      row.vendor || "-",
    ]);

    const worksheetData = [header, ...data];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Sparepart Internal");
    XLSX.writeFile(wb, "Daftar_Sparepart_Internal.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF("l", "pt", "a4");
    const tableColumn = ["Part","Kode Part","Leadtime (Hari)", "Reorder Min", "Reorder Max","On Hand Inventory","Vendor"];
    const tableRows = rows.map((row) => [
      row.part || "-",
      row.kodepart || "-",
      row.leadtime_hari || "-",
      row.reorder_min || "-",
      row.reorder_max || "-",
      row.on_hand_inventory || "-",
      row.vendor || "-",
    ]);
    doc.setFontSize(12);
    doc.text("Daftar Sparepart Internal", 40, 30);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: "grid",
      styles: { halign: "center", fontSize: 9 },
      headStyles: { fillColor: [0, 102, 204], textColor: 255 }
    });
    doc.save("Daftar_Sparepart_Internal.pdf");
  };

  // export monitoring pdf
  const exportMonitoringPDF = () => {
    const doc = new jsPDF("l","pt","a4");
    const tableColumn = ["Tipe","Tanggal","PR","PO","Kode Part","Part","Vendor","Status"];
    const tableRows = rows.filter((r) => r.noPr || r.PR || r.po || r.no_po).map((r)=>[
      r.tipe_kanban || "Internal",
      r.tanggal || "-",
      r.noPr || r.PR || "-",
      r.no_po || r.po || "-",
      r.kodepart || "-",
      r.part || "-",
      r.vendor || "-",
      r.status || "-"
    ]);
    doc.setFontSize(12);
    doc.text("Monitoring Kanban Internal - Data PR dan PO", 40, 30);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY:50, theme:"grid", styles:{halign:"center",fontSize:9}});
    doc.save("Monitoring_Kanban_Internal.pdf");
  };

  // ----------------- UI -----------------
  if (loading) {
    return (
      <div className="h-72 flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Kanban Internal</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-900 
             border border-gray-200 dark:border-gray-700 
             rounded-xl shadow-sm cursor-pointer
             transition-all duration-200 ease-out 
             hover:-translate-y-1 hover:shadow-md active:scale-95" 
              onClick={() => setShowListModal("total")}>
          <CardContent>
            <div className="text-sm text-slate-600 dark:text-slate-300">Total Sparepart Terpantau</div>
            <div className="text-2xl font-bold">{totalSparepart} Item</div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 
             border border-gray-200 dark:border-gray-700 
             rounded-xl shadow-sm cursor-pointer
             transition-all duration-200 ease-out 
             hover:-translate-y-1 hover:shadow-md active:scale-95" 
              onClick={() => setShowListModal("harusDipesan")}>
          <CardContent>
            <div className="text-sm text-slate-600 dark:text-slate-300">Part Harus Dipesan Bulan Ini</div>
            <div className="text-2xl font-bold">{partHarusDipesan} Item</div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 
             border border-gray-200 dark:border-gray-700 
             rounded-xl shadow-sm cursor-pointer
             transition-all duration-200 ease-out 
             hover:-translate-y-1 hover:shadow-md active:scale-95"
              onClick={() => setTab("monitoring")}>
          <CardContent>
            <div className="text-sm text-slate-600 dark:text-slate-300">Monitoring Kanban</div>
            <div className="text-2xl font-bold">📊 <span className="text-base font-medium">Lihat Status PR & PO</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Board view */}
      {tab === "board" && (
        <>
          <div className="grid grid-cols-3 gap-4 h-[75vh]">
            {/* Not Started */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded p-4 h-fit max-h-[60vh] flex flex-col">
              <h3 className="font-semibold mb-2">Not Started ({notStarted.length})</h3>
              <div className="space-y-3 h-[55vh] overflow-y-auto pr-1">
                {notStarted.map((r, idx) => (
                  <Card key={r.__sheetRow ?? idx} className="border">
                    <CardContent className="p-3">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-bold">{r.kodepart}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">{r.part}</div>
                        </div>
                        <div className="text-xs text-red-500">{r.deadline_pemesanan || "-"}</div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" onClick={() => createPR(r)}>Buat PR</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-4 h-fit max-h-[60vh] flex flex-col">
              <h3 className="font-semibold mb-2">In Progress ({inProgress.length})</h3>
              <div className="space-y-3 h-[55vh] overflow-y-auto pr-1">
                {inProgress.map((r, idx) => (
                  <Card key={r.__sheetRow ?? idx} className="border">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-bold">PR: {r.noPr || r.PR || "-"}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">{r.part}</div>
                        </div>
                        <div className="text-xs">{r.status}</div>
                      </div>

                      {r.status === "PR Dibuat" && (
                        <Button
                          size="sm"
                          className="bg-blue-600 text-white"
                          onClick={() => {
                            // langsung ambil nilai dari barisnya sendiri
                            const autoLeadtime = 
                              r["Leadtime (Hari)"] || 
                              r["leadtime_(hari)"] || 
                              r.leadtime_hari || 
                              "";

                            setRowPO(r);
                            setFormPO({
                              noPO: "",
                              tanggalPO: "",
                              leadtime: autoLeadtime, // ✅ langsung auto-isi
                              harga: "",
                              eta: ""
                            });
                            setShowPOForm(true);
                          }}
                        >
                          Input PO
                        </Button>
                      )}

                      {r.status === "PO Diajukan" && (
                        <Button size="sm" className="bg-green-600 text-white" onClick={() => {
                          setRowReceipt(r);
                          setFormReceipt({ tanggalReceipt: "", noReceipt: "" });
                          setShowReceiptForm(true);
                        }}>Input Receipt</Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Completed */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded p-4 h-fit max-h-[60vh] flex flex-col">
              <h3 className="font-semibold mb-2">Completed ({completed.length})</h3>
              <div className="space-y-3 h-[55vh] overflow-y-auto pr-1">
                {completed.map((r, idx) => (
                  <Card key={r.__sheetRow ?? idx} className="border">
                    <CardContent className="p-3">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-bold">{r.kodepart}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">{r.part}</div>
                        </div>
                        <div className="text-xs text-green-700">{r.status?.toLowerCase().includes("diterima") ? "Sudah Diterima" : "Sudah Diterima"}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* List */}
      {tab === "list" && (
        <>
          <div className="mb-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="px-3 py-2 border rounded w-72" />
          </div>

          <div className="overflow-x-auto rounded border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-2 text-center">Kode Part</th>
                  <th className="px-4 py-2 text-center">Part</th>
                  <th className="px-4 py-2 text-center">Deadline</th>
                  <th className="px-4 py-2 text-center">Supplier</th>
                  <th className="px-4 py-2 text-center">Status</th>
                  <th className="px-4 py-2 text-center">PR</th>
                  <th className="px-4 py-2 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r, idx) => (
                  <tr key={r.__sheetRow ?? idx} className="border-t hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">{r.kodepart}</td>
                    <td className="px-4 py-3">{r.part}</td>
                    <td className="px-4 py-3">{r.deadline_pemesanan || "-"}</td>
                    <td className="px-4 py-3">{r.vendor || "-"}</td>
                    <td className="px-4 py-3">{r.status || r.status_pemesanan || "-"}</td>
                    <td className="px-4 py-3">{r.noPr || r.PR || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {getKanbanStatusFromRow(r) === "not_started" && (
                          <Button size="sm" onClick={() => createPR(r)} disabled={processingKey === (r.kodepart || r.part)}>Buat PR</Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => {
                          const prVal = r.noPr || r.PR || r.pr || r.nopr || r.no_pr;
                          if (!prVal) { alert("Tidak ada PR untuk diupdate."); return; }
                          updateStatusByPR(prVal, "PO Diajukan");
                        }}>Update</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-6 text-sm text-slate-500">Tidak ada data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Monitoring */}
      {tab === "monitoring" && (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 mt-6 text-slate-900 dark:text-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Monitoring Kanban</h2>
            <Button onClick={() => exportMonitoringPDF()} className="bg-red-600 text-white flex items-center gap-2"><Printer size={16} /> Export PDF</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="px-3 py-2 text-center">Tipe</th>
                  <th className="px-3 py-2 text-center">Tanggal</th>
                  <th className="px-3 py-2 text-center">PR</th>
                  <th className="px-3 py-2 text-center">PO</th>
                  <th className="px-3 py-2 text-center">Kode Part</th>
                  <th className="px-3 py-2 text-center">Part</th>
                  <th className="px-3 py-2 text-center">Vendor</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.filter((r) => r.noPr || r.PR || r.po || r.no_po).map((r, idx) => (
                  <tr key={idx} className="border-t border-gray-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-3 py-2">{r.tipe_kanban || "Internal"}</td>
                    <td className="px-3 py-2">{r.tanggal || "-"}</td>
                    <td className="px-3 py-2">{r.noPr || r.PR || "-"}</td>
                    <td className="px-3 py-2">{r.no_po || r.po || "-"}</td>
                    <td className="px-3 py-2">{r.kodepart}</td>
                    <td className="px-3 py-2">{r.part}</td>
                    <td className="px-3 py-2">{r.vendor}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        r.status?.toLowerCase().includes("sudah") ? "bg-green-100 text-green-700" :
                        r.status?.toLowerCase().includes("po") ? "bg-orange-100 text-orange-700" :
                        r.status?.toLowerCase().includes("pr") ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {r.status || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
                {rows.filter((r) => r.noPr || r.PR || r.po || r.no_po).length === 0 && (
                  <tr><td colSpan={8} className="text-center py-4 text-slate-500">Tidak ada data PR/PO ditemukan</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-6">
            <Button className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700" onClick={() => setTab("board")}>Card Kanban</Button>
          </div>
        </div>
      )}

      {/* Modals - PR / PO / Receipt / List / Pemakaian */}
      {/* PR modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 w-[400px] border border-slate-200 dark:border-slate-700 transition-colors duration-300">
            <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100">Form Input PR</h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Tanggal *</label>
                <input type="date" className="w-full border rounded px-2 py-1" value={formData.tanggal} onChange={(e) => setFormData({...formData, tanggal: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">No PR *</label>
                <input type="text" className="w-full border rounded px-2 py-1" value={formData.noPR} onChange={(e) => setFormData({...formData, noPR: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Kode Part *</label>
                <input type="text" readOnly value={formData.kodePart} className="w-full border rounded px-2 py-1 bg-gray-100 dark:bg-slate-700 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-sm font-medium">Nama Part *</label>
                <input type="text" readOnly value={formData.namaPart} className="w-full border rounded px-2 py-1 bg-gray-100 dark:bg-slate-700 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-sm font-medium">Untuk Bulan *</label>
                <input type="text" className="w-full border rounded px-2 py-1" value={formData.bulan} onChange={(e) => setFormData({...formData, bulan: e.target.value})} />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm font-medium">Qty *</label>
                  <input type="number" className="w-full border rounded px-2 py-1" value={formData.qty} onChange={(e) => setFormData({...formData, qty: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">UOM *</label>
                  <select className="w-full border rounded px-2 py-1" value={formData.uom} onChange={(e) => setFormData({...formData, uom: e.target.value})}>
                    {uomOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Vendor *</label>
                <input type="text" className="w-full border rounded px-2 py-1" value={formData.vendor} onChange={(e) => setFormData({...formData, vendor: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">PIC *</label>
                <input type="text" className="w-full border rounded px-2 py-1" value={formData.pic} onChange={(e) => setFormData({...formData, pic: e.target.value})} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
              <Button className="bg-blue-600 text-white" onClick={async () => {
                if (!formData.tanggal || !formData.noPR || !formData.kodePart || !formData.namaPart || !formData.bulan || !formData.qty || !formData.uom || !formData.vendor || !formData.pic) {
                  alert("⚠️ Semua field wajib diisi sebelum membuat PR!");
                  return;
                }
                try {
                  const payload = {
                    payload: {
                      Tanggal: formData.tanggal,
                      PR: formData.noPR,
                      "Kode Part": formData.kodePart,
                      Part: formData.namaPart,
                      "Untuk Bulan": formData.bulan,
                      "Qty Order": formData.qty,
                      UOM: formData.uom,
                      Supplier: formData.vendor,
                      Status: "PR Dibuat",
                      "Tipe Kanban": "INTERNAL",
                      PIC: formData.pic,
                    }
                  };
                  const res = await fetch("/api/kanban", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  const json = await res.json();
                  if (!json.success) {
                    console.error("❌ Gagal simpan PR", json);
                    alert("❌ Gagal simpan PR, cek console log.");
                  } else {
                    alert("✅ PR berhasil dibuat!");
                    setShowForm(false);
                    setRows(prev => prev.map(row => row.kodepart === formData.kodePart ? { ...row, status: "PR Dibuat", noPr: formData.noPR, PR: formData.noPR, kanbanStatus: "in_progress" } : row));
                    setTimeout(async () => await fetchData(), 700);
                  }
                } catch (err) {
                  console.error("Submit error", err);
                  alert("❌ Terjadi error saat submit.");
                }
              }}>Submit PR</Button>
            </div>
          </div>
        </div>
      )}

      {/* PO modal */}
      {showPOForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 w-[400px] text-slate-900 dark:text-slate-100">
            <h2 className="text-lg font-bold mb-4">Input Data PO</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">No PO *</label>
                <input className="w-full border rounded px-2 py-1" value={formPO.noPO} onChange={(e) => setFormPO({...formPO, noPO: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Tanggal PO *</label>
                <input type="date" className="w-full border rounded px-2 py-1" value={formPO.tanggalPO} onChange={(e) => setFormPO({...formPO, tanggalPO: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Leadtime (hari) *</label>
                <input type="number" className="w-full border rounded px-2 py-1" value={formPO.leadtime} onChange={(e) => setFormPO({...formPO, leadtime: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Harga *</label>
                <input type="number" className="w-full border rounded px-2 py-1" value={formPO.harga} onChange={(e) => setFormPO({...formPO, harga: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">ETA *</label>
                <input type="date" className="w-full border rounded px-2 py-1" value={formPO.eta} onChange={(e) => setFormPO({...formPO, eta: e.target.value})} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowPOForm(false)}>Batal</Button>
              <Button className="bg-blue-600 text-white" onClick={async () => {
                if (!formPO.noPO || !formPO.tanggalPO || !formPO.leadtime) {
                  alert("Semua field wajib diisi!");
                  return;
                }
                const eta = new Date(formPO.tanggalPO);
                eta.setDate(eta.getDate() + parseInt(formPO.leadtime));
                if (!rowPO) { alert("Row not selected"); return; }
                await updatePO(rowPO, formPO.noPO, formPO.tanggalPO, eta.toISOString().slice(0,10));
                setShowPOForm(false);
              }}>Submit PO</Button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt modal */}
      {showReceiptForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 w-[400px] text-slate-900 dark:text-slate-100">
            <h2 className="text-lg font-bold mb-4">Input Receipt</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Tanggal Receipt *</label>
                <input type="date" className="w-full border rounded px-2 py-1" value={formReceipt.tanggalReceipt} onChange={(e) => setFormReceipt({...formReceipt, tanggalReceipt: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">No Receipt *</label>
                <input type="text" className="w-full border rounded px-2 py-1" value={formReceipt.noReceipt} onChange={(e) => setFormReceipt({...formReceipt, noReceipt: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowReceiptForm(false)}>Batal</Button>
              <Button className="bg-green-600 text-white" onClick={async () => {
                if (!formReceipt.tanggalReceipt || !formReceipt.noReceipt) { alert("Tanggal dan No Receipt wajib diisi!"); return; }
                if (!rowReceipt) return;
                await markReceived(rowReceipt, formReceipt.noReceipt, formReceipt.tanggalReceipt);
                setShowReceiptForm(false);
              }}>Submit Receipt</Button>
            </div>
          </div>
        </div>
      )}

      {/* List modal */}
      {showListModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 w-[90vw] max-w-6xl max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-700">
            {/* Header modal */}
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-lg font-bold">
                {showListModal === "total"
                  ? "Daftar Semua Sparepart"
                  : "Part Harus Dipesan Bulan Ini"}
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => exportExcel()}
                  className="bg-emerald-600 text-white flex items-center gap-2"
                >
                  <FileText size={16} /> Export Excel
                </Button>
                <Button
                  onClick={() =>
                    showListModal === "total" ? exportPDF() : exportMonitoringPDF()
                  }
                  className="bg-red-600 text-white flex items-center gap-2"
                >
                  <Printer size={16} /> Export PDF
                </Button>
              </div>
            </div>

            {/* Search bar */}
            <div className="mb-3 shrink-0">
              <input
                type="text"
                placeholder="Search Part / Kode Part"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-3 pr-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Table area - scrollable */}
            <div className="flex-1 overflow-y-auto border rounded-md">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 dark:bg-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-center">Part</th>
                    <th className="px-3 py-2 text-center">Kode Part</th>
                    <th className="px-3 py-2 text-center">Leadtime (Hari)</th>
                    <th className="px-3 py-2 text-center">Reorder Min</th>
                    <th className="px-3 py-2 text-center">Reorder Max</th>
                    <th className="px-3 py-2 text-center">On Hand Inventory</th>
                    <th className="px-3 py-2 text-center">Vendor</th>
                    <th className="px-3 py-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {(showListModal === "total"
                    ? rows
                    : rows.filter((r) => {
                        const status = (r.status || "").toLowerCase();
                        const deadline = r.deadline_pemesanan ? new Date(r.deadline_pemesanan) : null;

                        const now = new Date();
                        const currentMonth = now.getMonth();
                        const currentYear = now.getFullYear();

                        const isDueThisMonth = deadline
                          ? deadline.getMonth() === currentMonth && deadline.getFullYear() === currentYear
                          : false;

                        const fourteenDaysAgo = new Date();
                        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 30);
                        const receiptDate = r.tanggal_receipt ? new Date(r.tanggal_receipt) : null;
                        const isOldCompleted = receiptDate && receiptDate < fourteenDaysAgo;

                        return (
                          ((r.kanbanStatus === "not_started") ||
                            status.includes("segera pesan") ||
                            (status.includes("selesai") && isDueThisMonth)) &&
                          !isOldCompleted
                        );
                      })
                  )
                    .filter(
                      (r) =>
                        (r.part || "").toLowerCase().includes(search.toLowerCase()) ||
                        (r.kodepart || "")
                          .toLowerCase()
                          .includes(search.toLowerCase())
                    )
                    .map((r, idx) => (
                      <tr
                        key={idx}
                        className="border-t border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800/60"
                      >
                        <td className="px-3 py-2">{r.part}</td>
                        <td className="px-3 py-2">{r.kodepart}</td>
                        <td className="px-3 py-2 text-center">
                          {r.leadtime_hari || "-"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {r.reorder_min || "-"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {r.reorder_max || "-"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {r.on_hand_inventory || "-"}
                        </td>
                        <td className="px-3 py-2">{r.vendor}</td>
                        <td className="px-3 py-2 flex gap-2 justify-center">
                          {showListModal === "harusDipesan" &&
                            getKanbanStatusFromRow(r) === "not_started" && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setShowListModal(null);
                                  createPR(r);
                                }}
                                disabled={
                                  processingKey === (r.kodepart || r.part)
                                }
                              >
                                Buat PR
                              </Button>
                            )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setFormPemakaian({
                                tanggal: new Date().toISOString().slice(0, 10),
                                tipe_kanban: "INTERNAL",
                                kode_part: r.kodepart || "",
                                part: r.part || "",
                                qty_pemakaian: "",
                                keterangan: "",
                                operator: "",
                              });
                              setShowPemakaianForm(true);
                            }}
                          >
                            Input Pemakaian
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Footer tombol close */}
            <div className="flex justify-end mt-4 shrink-0">
              <Button variant="outline" onClick={() => setShowListModal(null)}>
                ❌ Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Input Pemakaian */}
      {showPemakaianForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 w-[400px] text-slate-900 dark:text-slate-100">
            <h2 className="text-lg font-bold mb-4">Input Pemakaian Sparepart</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Tanggal *</label>
                <input type="date" className="w-full border rounded px-2 py-1" value={formPemakaian.tanggal} onChange={(e) => setFormPemakaian({...formPemakaian, tanggal: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Kode Part *</label>
                <input type="text" readOnly value={formPemakaian.kode_part} className="w-full border rounded px-2 py-1 bg-gray-100 dark:bg-slate-700 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-sm font-medium">Nama Part</label>
                <input type="text" readOnly value={formPemakaian.part} className="w-full border rounded px-2 py-1 bg-gray-100 dark:bg-slate-700 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-sm font-medium">Qty Pemakaian *</label>
                <input type="number" className="w-full border rounded px-2 py-1" value={formPemakaian.qty_pemakaian} onChange={(e)=>setFormPemakaian({...formPemakaian, qty_pemakaian: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Keterangan</label>
                <input type="text" className="w-full border rounded px-2 py-1" value={formPemakaian.keterangan} onChange={(e)=>setFormPemakaian({...formPemakaian, keterangan: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Operator</label>
                <input type="text" className="w-full border rounded px-2 py-1" value={formPemakaian.operator} onChange={(e)=>setFormPemakaian({...formPemakaian, operator: e.target.value})} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowPemakaianForm(false)}>Batal</Button>
              <Button className="bg-blue-600 text-white" onClick={submitPemakaian}>Simpan</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}