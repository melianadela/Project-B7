// app/api/kanban/internal/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";

interface KanbanRow {
  __sheetRow?: number;
  kodepart?: string;
  part?: string;
  mesin?: string;
  category?: string;
  leadtime_hari?: string;
  on_hand_inventory?: string;
  reorder_min?: string;
  reorder_max?: string;
  qty_kebutuhan_reorder?: string;
  qty_kebutuhan_selanjutnya?: string;
  untuk_bulan?: string;
  status?: string;
  deadline_pemesanan?: string;
  qty_yang_dipesan?: string;
  supplier?: string;

  // tracking fields
  PR?: string;
  pr?: string;
  noPr?: string;
  po?: string;
  tanggal_po?: string;
  tanggalpo?: string;
  tanggal_receipt?: string;
  no_receipt?: string;
  harga?: string;
  leadtime?: string;
  eta?: string;
  [key: string]: any;
}

// --- Google Sheets client ---
function createSheetsClient() {
  const credentials = {
    type: process.env.TYPE || "service_account",
    project_id: process.env.project_id,
    private_key_id: process.env.private_key_id,
    private_key: (process.env.private_key || "").replace(/\\n/g, "\n"),
    client_email: process.env.account_email,
    client_id: process.env.client_id,
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

// normalize header string to key
function normalizeKey(h: string) {
  return (h || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

// read raw values (2D array)
async function readSheetRange(sheetName: string, range = "A:Z") {
  const sheets = createSheetsClient();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.sheet_id!,
    range: `${sheetName}!${range}`,
  });
  return resp.data.values || [];
}

// process rows → header detection + normalized objects
function processRows(rows: any[][]) {
  if (!rows || rows.length === 0) {
    return { headerRowIndex: -1, headers: [], dataRows: [], normalized: [], normalizedHeaderMap: {} as Record<string, number> };
  }

  // find header row: first row that contains at least one alnum cell
  const headerRowIndex = rows.findIndex((r) => Array.isArray(r) && r.some((c) => c && /[A-Za-z0-9]/.test(String(c))));
  if (headerRowIndex === -1)
    return { headerRowIndex: -1, headers: [], dataRows: [], normalized: [], normalizedHeaderMap: {} as Record<string, number> };

  const headers = (rows[headerRowIndex] || []).map((h) => (h ?? "").toString());
  const dataRows = rows.slice(headerRowIndex + 1);

  const normalizedHeaderMap: Record<string, number> = {};
  headers.forEach((h: string, i: number) => {
    normalizedHeaderMap[normalizeKey(h)] = i;
  });

  const normalized = dataRows
    .map((row: any[], rIdx: number) => {
      if (!row || row.every((c) => !c || String(c).trim() === "")) return null;
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        const k = normalizeKey(h);
        obj[k] = (row[idx] ?? "").toString();
      });
      const sheetRowNumber = headerRowIndex + 2 + rIdx;
      return { __sheetRow: sheetRowNumber, ...obj } as KanbanRow;
    })
    .filter(Boolean) as KanbanRow[];

  return { headerRowIndex, headers, dataRows, normalizedHeaderMap, normalized };
}

// --- API handler ---
export async function GET(request: NextRequest) {
  try {
    // read internal worksheet
    const internalRows = await readSheetRange("KANBAN_INTERNAL", "A1:Z1000");
    const processedInternal = processRows(internalRows);

    // read tracking (PR/PO/Receipt)
    const trackingRows = await readSheetRange("KANBAN_TRACKING", "A1:Z1000");
    const processedTracking = processRows(trackingRows);

    // merge by kode part (normalized)
    const merged = processedInternal.normalized.map((row) => {
      // possible keys: kode part could be "kode part" "kodepart" "kode_part"
      const kodePart =
        (row.kodepart || row["kode_part"] || row["kode_part"] || row["kode_part"] || row["kode_part"] || "").toString().trim();

      // find tracking row with matching kodepart or part (case-insensitive)
      const trackList = processedTracking.normalized.filter(
        (t) =>
          ((t.kodepart || t["kode_part"] || t.KodePart || "") + "")
            .trim()
            .toLowerCase() === kodePart.toLowerCase()
      );

      // ambil PR paling bawah (paling terbaru)
      const track = trackList.length > 0 ? trackList[trackList.length - 1] : null;

            // 🧠 Tentukan status Kanban berdasarkan data internal + tracking
      let kanbanStatus = "ignore";
      const statusInternal = (row.status || "").toLowerCase().trim();
      const statusTracking = (track?.status || "").toLowerCase().trim();

      if (!track && statusInternal.includes("segera pesan")) {
        kanbanStatus = "not_started";
      } else if (track) {
        if (
          statusTracking.includes("sudah diterima") ||
          statusTracking.includes("selesai") ||
          statusTracking.includes("completed")
        ) {
          kanbanStatus = "completed";
        } else if (
          statusTracking.includes("pr dibuat") ||
          statusTracking.includes("need to po") ||
          statusTracking.includes("po diajukan") ||
          statusTracking.includes("need to receipt")
        ) {
          kanbanStatus = "in_progress";
        }
      }

      return {
        ...row,
        ...track,
        kanbanStatus,
        // normalize common fields
        kodepart: row.kodepart || row["kode_part"] || row["kode_part"] || "",
        part: row.part || row.Part || "",
        mesin: row.mesin || row.Mesin || "",
        leadtime_hari: row["leadtime_(hari)"] || row["leadtime_(hari)"] || row.leadtime_hari || row["leadtime_hari"] || "",
        on_hand_inventory: row["on_hand_inventory"] || row.on_hand_inventory || row["on hand inventory"] || "",
        status: track?.status || row.status || row["status_pemesanan"] || "",
        no_pr: track?.pr || track?.PR || row.no_pr || "",
        tanggal_pr: track?.tanggal_pr || row.tanggal_pr || "",
        no_po: track?.po || row.no_po,
        tanggal_po: track?.tanggal_po || row.tanggal_po,
        tanggal_receipt: track?.tanggal_receipt || row.tanggal_receipt,
        no_receipt: track?.no_receipt || row.no_receipt,
      } as KanbanRow & { kanbanStatus: string };
    });

    return NextResponse.json({
      success: true,
      worksheet: "KANBAN_INTERNAL",
      totalRows: merged.length,
      data: merged,
      headers: processedInternal.headers,
    });
  } catch (err: any) {
    console.error("GET /api/kanban/internal error:", err);
    return NextResponse.json({ success: false, error: err.message || "Unknown error" }, { status: 500 });
  }
}

// POST → buat PR baru: tulis ke KANBAN_TRACKING
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = body.payload ?? body;
    const sheets = createSheetsClient();

  // 🔍 DETEKSI INPUT PEMAKAIAN (lebih kuat & compatible)
  const isPemakaian =
    payload?.formType === "pemakaian" ||
    typeof payload.qty_pemakaian !== "undefined";

  if (isPemakaian) {
    const now = new Date();
    const tanggal = payload.tanggal || now.toISOString().split("T")[0];

    const values = [
      tanggal,                                 // A
      "INTERNAL",                               // B
      payload.kode_part || payload.kodepart || "", // C
      payload.part || "",                       // D
      payload.qty_pemakaian || "",              // E
      payload.keterangan || "",                 // F
      payload.operator || "",                   // G
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.sheet_id!,
      range: `PEMAKAIAN_SPAREPART!A:G`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });

    return NextResponse.json({
      success: true,
      message: "Pencatatan pemakaian berhasil disimpan",
      values,
    });
  }

    // Build values according to KANBAN_TRACKING columns (A: Tanggal, B: PR, C: Tanggal PR, D: PO, E: Tanggal PO, F: Tipe Kanban, G: Kode Part, H: Part, ... up to U)
    const values = [
      payload.Tanggal ?? new Date().toISOString().split("T")[0],
      payload.PR ?? `PR-${Date.now()}`,
      payload.tanggalpr ?? new Date().toISOString().split("T")[0],
      "", // PO
      "", // Tanggal PO
      payload["Tipe Kanban"] ?? "INTERNAL",
      payload["Kode Part"] ?? payload.kodepart ?? "",
      payload.Part ?? payload.part ?? "",
      payload["Untuk Bulan"] ?? payload.untuk_bulan ?? "", // 🟢 ambil otomatis dari internal
      payload["Qty Order"] ?? payload.qty_kebutuhan_reorder ?? "", // 🟢 default dari internal
      payload.UOM ?? "",
      payload.Satuan ?? "",
      payload.Harga ?? "",
      payload.Supplier ?? "",
      payload.LeadTime ?? payload.leadtime ?? "",
      payload.ETA ?? "",
      "", // tanggal receipt
      "", // no receipt
      payload.Status ?? "PR Dibuat",
      payload.Keterangan ?? "",
      payload.PIC ?? "",
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.sheet_id!,
      range: `KANBAN_TRACKING!A:U`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });

    return NextResponse.json({ success: true, message: "PR created (KANBAN_TRACKING)", values });
  } catch (err: any) {
    console.error("POST /api/kanban/internal error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH → update PR (PO/Receipt/status/leadtime/harga/eta) in KANBAN_TRACKING
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = body.payload ?? body;

    const sheets = createSheetsClient();

    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.sheet_id!,
      range: `KANBAN_TRACKING!A:U`,
    });
    const rows = resp.data.values || [];
    if (rows.length === 0) return NextResponse.json({ success: false, error: "Sheet KANBAN_TRACKING kosong" }, { status: 404 });

    const data = rows.slice(1); // drop header
    // B column = PR (index 1)
    const targetIndex = data.findIndex((r) => (r[1] || "").toString().trim() === (payload.noPr || "").toString().trim());
    if (targetIndex === -1) return NextResponse.json({ success: false, error: "PR tidak ditemukan" }, { status: 404 });

    const targetRowNumber = targetIndex + 2; // header + offset
    const updates: Array<{ range: string; values: any[][] }> = [];

    if (payload.po) updates.push({ range: `KANBAN_TRACKING!D${targetRowNumber}`, values: [[payload.po]] });
    if (payload.tanggalpo) updates.push({ range: `KANBAN_TRACKING!E${targetRowNumber}`, values: [[payload.tanggalpo]] });
    if (payload.harga) updates.push({ range: `KANBAN_TRACKING!M${targetRowNumber}`, values: [[payload.harga]] });
    if (payload.leadtime) updates.push({ range: `KANBAN_TRACKING!O${targetRowNumber}`, values: [[payload.leadtime]] });
    if (payload.eta) updates.push({ range: `KANBAN_TRACKING!P${targetRowNumber}`, values: [[payload.eta]] });

    if (payload.tanggalreceipt) updates.push({ range: `KANBAN_TRACKING!Q${targetRowNumber}`, values: [[payload.tanggalreceipt]] });
    if (payload.noreceipt) updates.push({ range: `KANBAN_TRACKING!R${targetRowNumber}`, values: [[payload.noreceipt]] });

    // status handling
    if (payload.status) {
      updates.push({ range: `KANBAN_TRACKING!S${targetRowNumber}`, values: [[payload.status]] });
    } else if (payload.po) {
      updates.push({ range: `KANBAN_TRACKING!S${targetRowNumber}`, values: [["PO Diajukan"]] });
    } else if (payload.tanggalreceipt) {
      updates.push({ range: `KANBAN_TRACKING!S${targetRowNumber}`, values: [["Selesai"]] });
      updates.push({ range: `KANBAN_TRACKING!T${targetRowNumber}`, values: [[new Date().toISOString().split("T")[0]]] });
    }

    if (updates.length === 0) return NextResponse.json({ success: false, error: "Tidak ada field untuk diupdate" }, { status: 400 });

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: process.env.sheet_id!,
      requestBody: { valueInputOption: "USER_ENTERED", data: updates },
    });

    return NextResponse.json({ success: true, message: "Updated KANBAN_TRACKING", updates });
  } catch (err: any) {
    console.error("PATCH /api/kanban/internal error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}