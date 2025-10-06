// app/dashboard/kanban/external/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type KanbanRow = {
  __sheetRow?: number;
  kodepart?: string;
  part?: string;
  quantity?: string | number;
  uom?: string;
  vendor?: string;
  status?: string; // from tracking or external
  status_pemesanan?: string; // external sheet raw
  deadline_pemesanan?: string;
  PR?: string; // raw column PR if present
  noPr?: string; // normalized PR used in frontend
  kanbanStatus?: "not_started" | "in_progress" | "completed" | "ignore" | string;
  [k: string]: any;
};

// small helper: format emoji (optional)
function formatStatusWeb(s?: string) {
  if (!s) return "-";
  const low = s.toLowerCase();
  if (low.includes("cukup")) return "✅ Cukup";
  if (low.includes("siap") || low.includes("siapkan") || low.includes("harus"))
    return "⚠️ Siapkan Pemesanan";
  if (low.includes("pr")) return "📝 Proses PR";
  if (low.includes("po")) return "📦 Proses PO";
  if (low.includes("sudah") || low.includes("diterima")) return "✔️ Diterima";
  return s;
}

// frontend fallback logic in case backend hasn't set kanbanStatus yet
  function getKanbanStatusFromRow(r: KanbanRow) {
    // prefer backend
    if (r.kanbanStatus) return r.kanbanStatus;

    const prVal = (r.noPr || r.PR || r.pr || r.nopr || r.no_pr || "").toString().trim();
    const trackStatus = (r.status || r.Status || "").toString().toLowerCase();
    const externalStatus = (r.status_pemesanan || r.Status || "").toString().toLowerCase();

    if (prVal) {
      // kalau sudah selesai / diterima
      if (
        trackStatus.includes("diterima") ||
        trackStatus.includes("sudah") ||
        trackStatus.includes("received") ||
        trackStatus.includes("Sudah Diterima")   // ✅ tambahan
      ) {
        return "completed";
      }
      return "in_progress";
    }

    if (
      externalStatus.includes("siap") ||
      externalStatus.includes("siapkan") ||
      externalStatus.includes("harus") ||
      externalStatus.includes("minta")
    ) {
      return "not_started";
    }

    return "ignore";
  }

export default function KanbanExternalPage() {
  const uomOptions = [
    "EA",      // Each (satuan)
    "PCS",     // Pieces
    "SET",     // Satu set
    "BOX",     // Satu kotak
    "PACK",    // Satu bungkus
    "LITER",   // Liter
    "KG",      // Kilogram
    "M",       // Meter
    "CM",      // Centimeter
    "UNIT",    // Unit
    "..Others" // opsi lain-lain
  ];
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<KanbanRow[]>([]);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [tab, setTab] = useState<"board" | "list">("board");
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

  // PO form
  const [showPOForm, setShowPOForm] = useState(false);
  const [formPO, setFormPO] = useState({
    noPO: "",
    tanggalPO: "",
    leadtime: "",
    harga: "",
    eta:"",
  });
  const [rowPO, setRowPO] = useState<KanbanRow | null>(null);

  // Receipt form
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [formReceipt, setFormReceipt] = useState({
    tanggalReceipt: "",
    noReceipt: "",
  });
  const [rowReceipt, setRowReceipt] = useState<KanbanRow | null>(null);

    async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/kanban?type=external");
      const json = await res.json();
      if (!json.success) {
        console.error("API error:", json);
        setRows([]);
        setLoading(false);
        return;
      }

      const normalized = (json.data || []).map((r: any) => {
        // map common keys and keep raw object
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

          // ✅ tambahan mapping inventory
          kebutuhan_per_tahun: r.kebutuhan_per_tahun ?? r.KebutuhanPerTahun ?? r["Kebutuhan Per Tahun"] ?? "",
          safety_stock: r.safety_stock ?? r.SafetyStock ?? r["Safety Stock"] ?? "",
          total_kebutuhan: r.total_kebutuhan ?? r.TotalKebutuhan ?? r["Total Kebutuhan"] ?? "",
          sisa_qty_vendor: r.sisa_qty_vendor ?? r.SisaQtyVendor ?? r["Sisa Qty Vendor"] ?? "",
          on_hand_inventory: r.on_hand_inventory ?? r.OnHandInventory ?? r["On Hand Inventory"] ?? "",

          ...r,
          tanggal_receipt: r.tanggal_receipt ?? r.TanggalReceipt ?? "",
          no_receipt: r.no_receipt ?? r.NoReceipt ?? "",
        };
        return mapped;
      });

      // filter header-like rows / empty kodepart
      const filtered = normalized.filter((r: KanbanRow) => {
        const k = (r.kodepart || "").toString().trim().toLowerCase();
        if (!k) return false;
        if (["kode part", "kodepart", "kode"].includes(k)) return false;
        return true;
      });

      setRows(filtered);

      // ✅ debug log
      console.log(
        "ROWS AFTER FETCH",
        (filtered as KanbanRow[]).map((r) => ({
          kode: r.kodepart,
          vendor: r.vendor,
          safety: r.safety_stock,
          onHand: r.on_hand_inventory,
          status: r.status,
        }))
      );
    } catch (err) {
      console.error("fetchData error:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
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
    return rows.filter((r) => {
      // use deadline & external status to decide if must order this month
      const extStatus = (r.status_pemesanan || r.status || "").toString().toLowerCase();
      const flagged = extStatus.includes("siap") || extStatus.includes("siapkan") || extStatus.includes("harus") || extStatus.includes("minta");
      if (!r.deadline_pemesanan) return flagged;
      const parsed = Date.parse(r.deadline_pemesanan);
      if (!isNaN(parsed)) {
        const d = new Date(parsed);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }
      return flagged;
    }).length;
  }, [rows, currentMonth, currentYear]);

  // Groups based on computed kanban status (backend preferred, frontend fallback)
  const notStarted = useMemo(
    () => rows.filter((r) => getKanbanStatusFromRow(r) === "not_started"),
    [rows]
  );
  const inProgress = useMemo(
    () => rows.filter((r) => getKanbanStatusFromRow(r) === "in_progress"),
    [rows]
  );
  const completed = useMemo(
    () =>
      rows.filter((r) => {
        const ks = getKanbanStatusFromRow(r);
        if (ks !== "completed") return false;

        // auto-hide setelah 1 hari dari tanggalReceipt
        const tanggalReceipt = r.tanggal_receipt || r.tanggalReceipt;
        if (tanggalReceipt) {
          const d = new Date(tanggalReceipt);
          const diffDays = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 1) return false;
        }
        return true;
      }),
    [rows]
  );

  // filtered for list view (search)
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

  // Create PR: open form if noPR not given; if called with noPR argument, create directly (used in other flows)
  async function createPR(r: KanbanRow, noPR?: string) {
    if (!noPR) {
      // 🔹 ambil teks bulan otomatis dari kolom keterangan
      const bulanOtomatis = (() => {
        const ket = (r.keterangan || "").toString().trim();

        // cari kata setelah "Bulan"
        const match = ket.match(/Bulan\s+(\w+)/i);
        if (!match) return "";

        // konversi singkatan ke nama bulan lengkap (case-insensitive)
        const raw = match[1].toLowerCase();
        const mapBulan: Record<string, string> = {
          jan: "Januari",
          january: "Januari",
          feb: "Februari",
          february: "Februari",
          mar: "Maret",
          march: "Maret",
          apr: "April",
          april: "April",
          mei: "Mei",
          may: "Mei",
          jun: "Juni",
          june: "Juni",
          jul: "Juli",
          july: "Juli",
          agu: "Agustus",
          agt: "Agustus",
          aug: "Agustus",
          august: "Agustus",
          sep: "September",
          sept: "September",
          oct: "Oktober",
          okt: "Oktober",
          october: "Oktober",
          nov: "November",
          november: "November",
          dec: "Desember",
          des: "Desember",
          december: "Desember",
        };

        return mapBulan[raw] || match[1];
      })();

      // 🔹 isi form otomatis
setFormRow(r);

// amanin value dari kolom keterangan
const rawKeterangan = (r.keterangan || "").trim();

// regex buat cari nama bulan (baik singkatan atau lengkap)
const matchBulan = rawKeterangan.match(
  /(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)/i
);

// konversi singkatan ke bulan lengkap
const bulanMap: Record<string, string> = {
  Jan: "Januari",
  Feb: "Februari",
  Mar: "Maret",
  Apr: "April",
  Mei: "Mei",
  Jun: "Juni",
  Jul: "Juli",
  Agu: "Agustus",
  Sep: "September",
  Okt: "Oktober",
  Nov: "November",
  Des: "Desember",
};

const bulanFull =
  (matchBulan && bulanMap[matchBulan[0]]?.toString()) ||
  matchBulan?.[0] ||
  "";

// lalu isi form
setFormData({
  tanggal: new Date().toISOString().slice(0, 10),
  noPR: "",
  kodePart: r.kodepart || "",
  namaPart: r.part || "",
  bulan: bulanFull, // ✅ tampil langsung nama bulan, misal "November"
  qty: String(r.reorder_qty_kebutuhan_selanjutnya || r.quantity || ""), // ✅ dari kolom Re-order Qty
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
          Tanggal: new Date().toISOString().slice(0, 10),
          PR: noPR, // important: use PR key to match sheet column
          tanggalpr: new Date().toISOString().slice(0, 10),
          "Tipe Kanban": "EKSTERNAL",
          "Kode Part": r.kodepart,
          Part: r.part,
          "Untuk Bulan": new Date().toLocaleString("default", { month: "long", year: "numeric" }),
          "Qty Order": r.quantity,
          UOM: r.uom,
          Supplier: r.vendor,
          Status: "PR Dibuat",
        },
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
        // optimistic update: set noPr and status locally
        setRows((prev) =>
          prev.map((row) =>
            row.kodepart === r.kodepart
              ? { ...row, noPr: noPR, PR: noPR, status: "PR Dibuat", kanbanStatus: "in_progress" }
              : row
          )
        );
        // refresh from server to be safe
        await fetchData();
      }
    } catch (err) {
      console.error("createPR error", err);
      alert("❌ Terjadi error saat membuat PR.");
    } finally {
      setProcessingKey(null);
    }
  }

  // update status identified by PR (PATCH expects payload.noPr as key per route.ts)
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

  async function updatePO(
  r: KanbanRow,
  poNumber: string,
  tanggalpo: string,
  eta: string
) {
  const prValue = r.noPr || r.PR;
  if (!prValue) {
    alert("PR number not found for this item.");
    return;
  }

  setProcessingKey(prValue);
  try {
    // Ambil harga & leadtime dari state formPO
    const harga = formPO.harga || "";
    const leadtime = formPO.leadtime || "";

    const payload = {
      payload: {
        noPr: prValue,
        status: "PO Dibuat",
        po: poNumber,
        tanggalpo,
        eta,
        harga,      // ✅ kolom Harga (dari PR/PO)
        leadtime,   // ✅ kolom Lead time (hari)
      },
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
        },
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

  // export helpers

  const exportExcel = () => {
    // 🔹 Tentuin header kolom (tanpa "Aksi")
    const header = [
      "Part",
      "Kode Part",
      "Kebutuhan Per Tahun",
      "Safety Stock",
      "Total Kebutuhan",
      "Sisa Qty di Vendor",
      "On Hand Inventory",
      "Vendor",
    ];

    // 🔹 Siapin data sesuai urutan kolom
    const data = rows.map((row) => [
      row.part || "-",
      row.kodepart || "-",
      row.kebutuhan_per_tahun || row.total_kebutuhan_per_tahun || "-",
      row.safety_stock || row.safety_stock_statistik || "-",
      row.total_kebutuhan || row.total_kebutuhan_per_tahun || "-",
      row.sisa_qty_vendor || row.sisa_qty_di_vendor || "-",
      row.on_hand_inventory || row.on_hand_invenotry || "-",
      row.vendor || row.supplier || "-",
    ]);

    // 🔹 Gabung header + data
    const worksheetData = [header, ...data];

    // 🔹 Buat worksheet & workbook
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // 🔹 Styling angka biar center (optional, cuma untuk tampilan di Excel)
    const range = XLSX.utils.decode_range(ws["!ref"]|| "A1:A1");
      for (let R = 1; R <= range.e.r; ++R) {
        for (let C = 2; C <= 6; ++C) {
          const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
          if (cell) cell.s = { alignment: { horizontal: "center" } };
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Daftar Sparepart");

      // 🔹 Simpan file
      XLSX.writeFile(wb, "Daftar_Sparepart.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF("l", "pt", "a4");

    const tableColumn = [
      "Part",
      "Kode Part",
      "Kebutuhan Per Tahun",
      "Safety Stock",
      "Total Kebutuhan",
      "Sisa Qty di Vendor",
      "On Hand Inventory",
      "Vendor",
    ];

    const tableRows = rows.map((row) => [
      row.part || "-",
      row.kodepart || "-",
      row.kebutuhan_per_tahun || row.total_kebutuhan_per_tahun || "-",
      row.safety_stock || row.safety_stock_statistik || "-",
      row.total_kebutuhan || row.total_kebutuhan_per_tahun || "-",
      row.sisa_qty_vendor || row.sisa_qty_di_vendor || "-",
      row.on_hand_inventory || row.on_hand_invenotry || "-",
      row.vendor || row.supplier || "-",
    ]);

    doc.setFontSize(12);
    doc.text("Daftar Semua Sparepart", 40, 30);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: "grid",
      styles: {
        halign: "center",
        valign: "middle",
        fontSize: 9,
      },
      headStyles: {
        fillColor: [0, 102, 204],
        textColor: 255,
        halign: "center",
      },
      columnStyles: {
        0: { halign: "left" }, // kolom Part biar kiri
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "center" },
        4: { halign: "center" },
        5: { halign: "center" },
        6: { halign: "center" },
        7: { halign: "left" },
      },
    });

    doc.save("Daftar_Sparepart.pdf");
  };

  if (loading) {
    return (
      <div className="h-72 flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Kanban Eksternal</h1>

      <div className="grid grid-cols-2 gap-4">
        {/* Total Sparepart */}
        <Card
          onClick={() => setShowListModal("total")}
          className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 
                    cursor-pointer transition-all duration-200 ease-out
                    hover:-translate-y-1 hover:shadow-lg
                    hover:bg-blue-100 dark:hover:bg-blue-800/40
                    active:scale-95"
        >
          <CardContent>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Total Sparepart Kontrak Servis
            </div>
            <div className="text-2xl font-bold">{totalSparepart} Item</div>
          </CardContent>
        </Card>

        {/* Part Harus Dipesan */}
        <Card
          onClick={() => setShowListModal("harusDipesan")}
          className="bg-red-50 border-red-200 dark:bg-red-900/20 
                    cursor-pointer transition-all duration-200 ease-out
                    hover:-translate-y-1 hover:shadow-lg
                    hover:bg-red-100 dark:hover:bg-red-800/40
                    active:scale-95"
        >
          <CardContent>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Part Harus Dipesan Bulan Ini
            </div>
            <div className="text-2xl font-bold">{partHarusDipesan} Item</div>
          </CardContent>
        </Card>
      </div>

        {/* BOARD */}
        {tab === "board" && (
          <>

            <div className="grid grid-cols-3 gap-4 h-[75vh]">
              {/* Not Started */}
              <div className="bg-red-50 dark:bg-slate-800 rounded p-4">
                <h3 className="font-semibold mb-2">Not Started ({notStarted.length})</h3>
                <div className="space-y-3">
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
                          <Button
                            size="sm"
                            onClick={() => createPR(r)}
                          >
                            Buat PR
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* In Progress */}
              <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded p-4">
                <h3 className="font-semibold mb-2">In Progress ({inProgress.length})</h3>
                <div className="space-y-3">
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
                              setRowPO(r);
                              setFormPO({ noPO: "", tanggalPO: "", leadtime: "", harga: "",eta:"" });
                              setShowPOForm(true);
                            }}
                          >
                            Input PO
                          </Button>
                        )}

                        {r.status === "PO Dibuat" && (
                          <Button
                            size="sm"
                            className="bg-green-600 text-white"
                            onClick={() => {
                              setRowReceipt(r);
                              setFormReceipt({ tanggalReceipt: "", noReceipt: "" });
                              setShowReceiptForm(true);
                            }}
                          >
                            Input Receipt
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Completed */}
              <div className="bg-green-50 dark:bg-green-900/10 rounded p-4">
                <h3 className="font-semibold mb-2">Completed ({completed.length})</h3>
                <div className="space-y-3">
                  {completed.map((r, idx) => (
                    <Card key={r.__sheetRow ?? idx} className="border">
                      <CardContent className="p-3">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-bold">{r.kodepart}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">{r.part}</div>
                          </div>
                          <div className="text-xs text-green-700">
                            {r.status?.toLowerCase().includes("diterima") ? "Sudah Diterima" : "Sudah Diterima"}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* LIST */}
        {tab === "list" && (
          <>
            <div className="mb-3">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="px-3 py-2 border rounded w-72" />
            </div>

            <div className="overflow-x-auto rounded border">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-2 text-left">Kode Part</th>
                    <th className="px-4 py-2 text-left">Part</th>
                    <th className="px-4 py-2 text-left">Deadline</th>
                    <th className="px-4 py-2 text-left">Supplier</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">PR</th>
                    <th className="px-4 py-2 text-left">Aksi</th>
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
                          {/* show Buat PR only if row qualifies */}
                          {getKanbanStatusFromRow(r) === "not_started" && (
                            <Button size="sm" onClick={() => createPR(r)} disabled={processingKey === (r.kodepart || r.part)}>
                              Buat PR
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => {
                            // if there's a PR, update status by PR
                            const prVal = r.noPr || r.PR || r.pr || r.nopr || r.no_pr;
                            if (!prVal) {
                              alert("Tidak ada PR untuk diupdate.");
                              return;
                            }
                            updateStatusByPR(prVal, "PO Diajukan");
                          }}>
                            Update
                          </Button>
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

      {/* PR modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[400px]">
            <h2 className="text-lg font-bold mb-4">Form Input PR</h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Tanggal *</label>
                <input
                  type="date"
                  className="w-full border rounded px-2 py-1"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">No PR *</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  value={formData.noPR}
                  onChange={(e) => setFormData({ ...formData, noPR: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Kode Part *</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1 bg-gray-100"
                  value={formData.kodePart}
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nama Part *</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1 bg-gray-100"
                  value={formData.namaPart}
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm font-medium">Untuk Bulan *</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  value={formData.bulan}
                  onChange={(e) => setFormData({ ...formData, bulan: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm font-medium">Qty *</label>
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-1"
                    value={formData.qty}
                    onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">UOM *</label>
                  <select
                    className="w-full border rounded px-2 py-1 bg-white"
                    value={formData.uom}
                    onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                  >
                    {uomOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Vendor *</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1 bg-gray-100"
                  value={formData.vendor}
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm font-medium">PIC *</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  value={formData.pic || ""}
                  onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
              <Button
                className="bg-blue-600 text-white"
                onClick={async () => {
                  if (!formData.tanggal || !formData.noPR || !formData.kodePart || !formData.namaPart || !formData.bulan || !formData.qty || !formData.uom || !formData.vendor|| !formData.pic) {
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
                        "Tipe Kanban": "EKSTERNAL",
                        PIC: formData.pic,
                      },
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

                      setRows((prev) =>
                        prev.map((row) =>
                          row.kodepart === formData.kodePart
                            ? { ...row, status: "PR Dibuat", noPr: formData.noPR, PR: formData.noPR, kanbanStatus: "in_progress" }
                            : row
                        )
                      );

                      setTimeout(async () => {
                        await fetchData();
                      }, 800);
                    }
                  } catch (err) {
                    console.error("Submit error", err);
                    alert("❌ Terjadi error saat submit.");
                  }
                }}
              >
                Submit PR
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PO modal */}
      {showPOForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[400px]">
            <h2 className="text-lg font-bold mb-4">Input Data PO</h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">No PO *</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  value={formPO.noPO}
                  onChange={(e) => setFormPO({ ...formPO, noPO: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tanggal PO *</label>
                <input
                  type="date"
                  className="w-full border rounded px-2 py-1"
                  value={formPO.tanggalPO}
                  onChange={(e) => setFormPO({ ...formPO, tanggalPO: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Leadtime (hari) *</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={formPO.leadtime}
                  onChange={(e) => setFormPO({ ...formPO, leadtime: e.target.value })}
                />
              </div>
              <label className="text-sm font-medium">Harga *</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1"
                value={formPO.harga}
                onChange={(e) => setFormPO({ ...formPO, harga: e.target.value })}
              />

              <label className="text-sm font-medium">ETA *</label>
              <input
                type="date"
                className="w-full border rounded px-2 py-1"
                value={formPO.eta}
                onChange={(e) => setFormPO({ ...formPO, eta: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowPOForm(false)}>Batal</Button>
              <Button
                className="bg-blue-600 text-white"
                onClick={async () => {
                  if (!formPO.noPO || !formPO.tanggalPO || !formPO.leadtime) {
                    alert("Semua field wajib diisi!");
                    return;
                  }
                  const eta = new Date(formPO.tanggalPO);
                  eta.setDate(eta.getDate() + parseInt(formPO.leadtime));

                  if (!rowPO) {
                    alert("Row not selected");
                    return;
                  }

                  await updatePO(rowPO, formPO.noPO, formPO.tanggalPO, eta.toISOString().slice(0,10));
                  setShowPOForm(false);
                }}
              >
                Submit PO
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt modal */}
      {showReceiptForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[400px]">
            <h2 className="text-lg font-bold mb-4">Input Receipt</h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Tanggal Receipt *</label>
                <input
                  type="date"
                  className="w-full border rounded px-2 py-1"
                  value={formReceipt.tanggalReceipt}
                  onChange={(e) => setFormReceipt({ ...formReceipt, tanggalReceipt: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">No Receipt *</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  value={formReceipt.noReceipt}
                  onChange={(e) => setFormReceipt({ ...formReceipt, noReceipt: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowReceiptForm(false)}>Batal</Button>
              <Button
                className="bg-green-600 text-white"
                onClick={async () => {
                  if (!formReceipt.tanggalReceipt || !formReceipt.noReceipt) {
                    alert("Tanggal dan No Receipt wajib diisi!");
                    return;
                  }
                  if (!rowReceipt) return;

                  await markReceived(rowReceipt, formReceipt.noReceipt, formReceipt.tanggalReceipt);
                  setShowReceiptForm(false);
                }}
              >
                Submit Receipt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* List Modal */}
      {showListModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[95%] max-w-[1200px] max-h-[85vh] overflow-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
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
                  <FileText size={16}/> Export Excel
                </Button>
                <Button 
                  onClick={() => exportPDF()} 
                  className="bg-red-600 text-white flex items-center gap-2"
                >
                  <Printer size={16}/> Export PDF
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center border rounded-full px-3 py-2 mb-3 w-96 bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-gray-400 mr-2" 
                  fill="none" viewBox="0 0 24 24" 
                  stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M21 21l-4.35-4.35M9 17a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Search Part/Kode Part" 
                className="bg-transparent outline-none w-full text-sm"
              />
            </div>

            {/* Table */}
            <table className="min-w-full text-sm border">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left">Part</th>
                  <th className="px-3 py-2 text-left">Kode Part</th>
                  <th className="px-3 py-2 text-left">Kebutuhan Per Tahun</th>
                  <th className="px-3 py-2 text-left">Safety Stock</th>
                  <th className="px-3 py-2 text-left">Total Kebutuhan</th>
                  <th className="px-3 py-2 text-left">Sisa Qty di Vendor</th>
                  <th className="px-3 py-2 text-left">On Hand Inventory</th>
                  <th className="px-3 py-2 text-left">Vendor</th>
                  <th className="px-3 py-2 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r, idx) => (
                  <tr key={idx} className="border-t hover:bg-slate-50">
                    <td className="px-3 py-2">{r.part}</td>
                    <td className="px-3 py-2">{r.kodepart}</td>
                    <td className="px-3 py-2">{r.kebutuhan_per_tahun || "-"}</td>
                    <td className="px-3 py-2">{r.safety_stock_statistik || "-"}</td>
                    <td className="px-3 py-2">{r.total_kebutuhan_per_tahun || "-"}</td>
                    <td className="px-3 py-2">{r.sisa_qty_di_vendor || "-"}</td>
                    <td className="px-3 py-2">{r.on_hand_invenotry || "-"}</td>
                    <td className="px-3 py-2">{r.vendor}</td>
                    <td className="px-3 py-2">
                      <Button variant="ghost" size="icon">
                        ✏️
                      </Button>
                    </td>
                  </tr>
                ))}

                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-6 text-sm text-slate-500">
                      Tidak ada data ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Footer */}
            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setShowListModal(null)}
              >
                ❌ Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
