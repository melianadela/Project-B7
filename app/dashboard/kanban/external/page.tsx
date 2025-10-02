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
  // 1) prefer backend-provided field
  if (r.kanbanStatus) return r.kanbanStatus;

  // normalize PR existence
  const prVal = (r.noPr || r.PR || r.pr || r.nopr || r.no_pr || "").toString().trim();

  // normalize tracking status if any (tracking.status usually lives in r.status or r.Status)
  const trackStatus = (r.status || r.Status || "").toString().toLowerCase();
  const externalStatus = (r.status_pemesanan || r.status_pemesanan || r.Status || r.status || "").toString().toLowerCase();

  if (prVal) {
    // if there is PR, decide between in_progress / completed based on tracking status
    if (trackStatus.includes("diterima") || trackStatus.includes("sudah") || trackStatus.includes("received")) {
      return "completed";
    }
    return "in_progress";
  }

  // no PR => Not Started only if external sheet suggests "siapkan"
  if (externalStatus.includes("siap") || externalStatus.includes("siapkan") || externalStatus.includes("harus") || externalStatus.includes("minta")) {
    return "not_started";
  }

  // otherwise ignore (don't show on board)
  return "ignore";
}

export default function KanbanExternalPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<KanbanRow[]>([]);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [tab, setTab] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");
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
  });

  // PO form
  const [showPOForm, setShowPOForm] = useState(false);
  const [formPO, setFormPO] = useState({
    noPO: "",
    tanggalPO: "",
    leadtime: "",
    qty: "",
  });
  const [rowPO, setRowPO] = useState<KanbanRow | null>(null);

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
          PR: r.PR ?? r.pr ?? r.nopr ?? r.no_pr ?? "", // raw PR column if exists
          noPr: (r.PR ?? r.pr ?? r.nopr ?? r.no_pr ?? "").toString(),
          status: r.status_pemesanan ?? r.status ?? r.Status ?? "",
          status_pemesanan: r.status_pemesanan ?? r.Status ?? "",
          deadline_pemesanan: r.deadline_pemesanan ?? r.deadline ?? r.Deadline ?? "",
          kanbanStatus: r.kanbanStatus ?? r.kanban_status ?? undefined,
          ...r,
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
    () => rows.filter((r) => getKanbanStatusFromRow(r) === "completed"),
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
      // open modal
      setFormRow(r);
      setFormData({
        tanggal: new Date().toISOString().slice(0, 10),
        noPR: "",
        kodePart: r.kodepart || "",
        namaPart: r.part || "",
        bulan: "",
        qty: String(r.quantity || ""),
        uom: r.uom || "",
        vendor: r.vendor || "",
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

  async function updatePO(r: KanbanRow, poNumber: string, tanggalpo: string, eta: string) {
    const prValue = r.noPr || r.PR || r.pr || r.nopr || r.no_pr;
    if (!prValue) {
      alert("PR number not found for this item.");
      return;
    }
    setProcessingKey(prValue || "updatePO");
    try {
      const payload = {
        payload: {
          noPr: prValue,
          status: "PO Diajukan",
          po: poNumber,
          tanggalpo: tanggalpo,
          eta: eta,
        },
      };
      const res = await fetch("/api/kanban", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) console.error("updatePO failed", json);
      await fetchData();
    } catch (err) {
      console.error("updatePO error", err);
    } finally {
      setProcessingKey(null);
    }
  }

  async function markReceived(r: KanbanRow, noReceipt: string) {
    const prValue = r.noPr || r.PR || r.pr || r.nopr || r.no_pr;
    if (!prValue) {
      alert("PR number not found for this item.");
      return;
    }
    setProcessingKey(prValue || "markReceived");
    try {
      const payload = {
        payload: {
          noPr: prValue,
          status: "Sudah Diterima",
          tanggalreceipt: new Date().toISOString().slice(0, 10),
          noreceipt: noReceipt,
        },
      };
      const res = await fetch("/api/kanban", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) console.error("markReceived failed", json);
      await fetchData();
    } catch (err) {
      console.error("markReceived error", err);
    } finally {
      setProcessingKey(null);
    }
  }

  // export helpers
  function exportExcel() {
    const data = filteredRows.map((r) => ({
      KodePart: r.kodepart,
      Part: r.part,
      Deadline: r.deadline_pemesanan,
      Supplier: r.vendor,
      Status: r.status || r.status_pemesanan || "-",
      PR: r.noPr || r.PR || "-",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "kanban_eksternal");
    XLSX.writeFile(wb, `kanban_eksternal_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function exportPDF() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(12);
    doc.text("Kanban Eksternal", 50, 50);
    const body = filteredRows.map((r) => [
      r.kodepart || "-",
      r.part || "-",
      r.deadline_pemesanan || "-",
      r.vendor || "-",
      r.noPr || r.PR || "-",
      r.status || "-",
    ]);
    autoTable(doc, {
      startY: 60,
      head: [["Kode Part", "Part", "Deadline", "Supplier", "PR", "Status"]],
      body,
      styles: { fontSize: 9 },
    });
    doc.save(`kanban_eksternal_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

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
        <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20">
          <CardContent>
            <div className="text-sm text-slate-600 dark:text-slate-300">Total Sparepart Kontrak Servis</div>
            <div className="text-2xl font-bold">{totalSparepart} Item</div>
          </CardContent>
        </Card>

        <Card className="bg-violet-50 border-violet-200 dark:bg-violet-900/20">
          <CardContent>
            <div className="text-sm text-slate-600 dark:text-slate-300">Part Harus Dipesan Bulan ini</div>
            <div className="text-2xl font-bold">{partHarusDipesan} Item</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-md border px-2 py-1">
            <button className={`px-4 py-2 ${tab === "board" ? "bg-slate-200 dark:bg-slate-700" : ""}`} onClick={() => setTab("board")}>
              Board View
            </button>
            <button className={`px-4 py-2 ${tab === "list" ? "bg-slate-200 dark:bg-slate-700" : ""}`} onClick={() => setTab("list")}>
              List View
            </button>
          </div>

          <div className="ml-auto flex gap-2">
            <Button onClick={exportExcel} className="bg-emerald-600 text-white hover:bg-emerald-700">
              <FileText className="mr-2" />Export Excel
            </Button>
            <Button onClick={exportPDF} className="bg-red-600 text-white hover:bg-red-700">
              <Printer className="mr-2" />Export PDF
            </Button>
          </div>
        </div>

        {/* BOARD */}
        {tab === "board" && (
          <>
            <div className="mb-3 flex gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search kode/part/vendor..." className="px-3 py-2 border rounded w-72" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Not Started */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded p-4">
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

                        <Button
                          size="sm"
                          className="bg-blue-600 text-white"
                          onClick={() => {
                            setRowPO(r);
                            setFormPO({ noPO: "", tanggalPO: "", leadtime: "", qty: "" });
                            setShowPOForm(true);
                          }}
                        >
                          Input PO
                        </Button>
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
                          <div className="text-xs text-green-700">{r.status}</div>
                        </div>
                        <div className="mt-2">
                          <Button size="sm" onClick={() => markReceived(r, "RCPT-" + Date.now())} disabled={processingKey === (r.noPr || r.PR || r.kodepart)}>
                            {processingKey === (r.noPr || r.PR || r.kodepart) ? "Processing..." : "Input Receipt"}
                          </Button>
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
      </div>

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
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-1"
                    value={formData.uom}
                    onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                  />
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
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
              <Button
                className="bg-blue-600 text-white"
                onClick={async () => {
                  if (!formData.tanggal || !formData.noPR || !formData.kodePart || !formData.namaPart || !formData.bulan || !formData.qty || !formData.uom || !formData.vendor) {
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
              <div>
                <label className="text-sm font-medium">Qty *</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={formPO.qty}
                  onChange={(e) => setFormPO({ ...formPO, qty: e.target.value })}
                />
              </div>
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
    </div>
  );
}
