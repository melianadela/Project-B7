import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";

// --- Interface untuk baris Kanban ---
interface KanbanTrackingRow {
  __sheetRow: number;
  kodepart?: string;
  kode_part?: string;
  status?: string;
  status_pemesanan?: string;
  pr?: string;
  PR?: string;
  no_pr?: string;
  tanggal_pr?: string;
  po?: string;
  no_po?: string;
  tanggal_po?: string;
  tanggal_receipt?: string;
  no_receipt?: string;
  [key: string]: any;
}

// --- Client Google Sheets ---
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

// --- Helper normalisasi key ---
function normalizeKey(h: string) {
  return (h || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

// --- Baca data dari sheet ---
async function readSheetRange(sheetName: string, range = "A:Z") {
  const sheets = createSheetsClient();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.sheet_id!,
    range: `${sheetName}!${range}`,
  });
  return resp.data.values || [];
}

// --- Proses rows jadi object ---
function processRows(rows: any[][]) {
  if (!rows || rows.length === 0) {
    return {
      headerRowIndex: -1,
      headers: [],
      dataRows: [],
      normalizedHeaderMap: {} as Record<string, number>,
      normalized: [] as KanbanTrackingRow[],
    };
  }

  const headerRowIndex = rows.findIndex(
    (r) => Array.isArray(r) && r.some((c) => c && /[A-Za-z0-9]/.test(String(c)))
  );

  if (headerRowIndex === -1) {
    return {
      headerRowIndex: -1,
      headers: [],
      dataRows: [],
      normalizedHeaderMap: {} as Record<string, number>,
      normalized: [] as KanbanTrackingRow[],
    };
  }

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
      return { __sheetRow: sheetRowNumber, ...obj } as KanbanTrackingRow;
    })
    .filter(Boolean) as KanbanTrackingRow[];

  return { headerRowIndex, headers, dataRows, normalizedHeaderMap, normalized };
}

// --- Tentukan worksheet berdasarkan type ---
function worksheetForType(type?: string) {
  if (!type) return "KANBAN_EKSTERNAL";
  const t = String(type).toLowerCase();
  if (t.includes("internal")) return "KANBAN_INTERNAL";
  return "KANBAN_EKSTERNAL";
}

// --- GET API ---
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "external";
    const worksheet = worksheetForType(type);

    // ambil data eksternal/internal
    const rows = await readSheetRange(worksheet, "A1:Q1000");
    const processed = processRows(rows);

    // ambil data tracking
    const trackingRows = await readSheetRange("KANBAN_TRACKING", "A1:Z1000");
    const processedTracking = processRows(trackingRows);

    // merge dengan tracking
  const eksternal = processed.normalized.map((row) => {
    const kodePart = row.kodepart || row.kode_part || "";

    const track = processedTracking.normalized.find(
      (t) => (t.kodepart || t.kode_part || "") === kodePart
    );

    // default status
    let kanbanStatus = "ignore";
    const mergedStatus = (track?.status || row.status || row.status_pemesanan || "").toLowerCase();

    if (!track && (row.status_pemesanan || "").toLowerCase().includes("siapkan")) {
      kanbanStatus = "not_started";
    } else if (track) {
      if (
        mergedStatus.includes("selesai") ||
        mergedStatus.includes("diterima") ||
        mergedStatus.includes("sudah")
      ) {
        kanbanStatus = "completed";
      } else {
        kanbanStatus = "in_progress";
      }
    }

    return {
      ...row,
      ...track,
      kanbanStatus,
      status: track?.status || row.status || row.status_pemesanan || "",
      status_pemesanan: row.status_pemesanan || "",
      no_pr: track?.pr || track?.PR || row.no_pr || "",
      tanggal_pr: track?.tanggal_pr || row.tanggal_pr,
      no_po: track?.po || row.no_po,
      tanggal_po: track?.tanggal_po || row.tanggal_po,
      tanggal_receipt: track?.tanggal_receipt || row.tanggal_receipt,
      no_receipt: track?.no_receipt || row.no_receipt,
    } as KanbanTrackingRow & { kanbanStatus: string };
  });

    return NextResponse.json({
      success: true,
      worksheet,
      totalRows: eksternal.length,
      data: eksternal,
      headers: processed.headers,
    });
  } catch (err: any) {
    console.error("GET /api/kanban error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = body.payload ?? body;
    const sheets = createSheetsClient();

    // deteksi otomatis: kalau ada field qty_pemakaian → berarti form pemakaian
    const isPemakaian = !!payload.qty_pemakaian || !!payload.operator;

    if (isPemakaian) {
      // 🧾 kirim ke sheet KANBAN_PEMAKAIAN
      const now = new Date();
      const tanggal = payload.tanggal || now.toISOString().split("T")[0];
      const values = [
        tanggal,                            // A: tanggal
        payload.tipe_kanban || "EKSTERNAL", // B
        payload.kode_part || "",             // C
        payload.part || "",                  // D
        payload.qty_pemakaian || "",         // E
        payload.keterangan || "",            // F
        payload.operator || "",              // G
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.sheet_id!,
        range: `PEMAKAIAN_SPAREPART!A:G`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [values] },
      });

      return NextResponse.json({
        success: true,
        message: "✅ Data pemakaian berhasil ditambahkan ke KANBAN_PEMAKAIAN",
        values,
      });
    }

    // ✳️ selain itu tetap ke sheet KANBAN_TRACKING (buat PR/PO)
    const values = [
      payload.Tanggal ?? new Date().toISOString().split("T")[0],
      payload.PR ?? `PR-${Date.now()}`,
      payload.tanggalpr ?? new Date().toISOString().split("T")[0],
      "",
      "",
      payload["Tipe Kanban"] ?? "EKSTERNAL",
      payload["Kode Part"] ?? "",
      payload.Part ?? "",
      payload["Untuk Bulan"] ?? "",
      payload["Qty Order"] ?? "",
      payload.UOM ?? "",
      payload.Satuan ?? "",
      payload.Harga ?? "",
      payload.Supplier ?? "",
      payload.LeadTime ?? "",
      payload.ETA ?? "",
      "",
      "",
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

    return NextResponse.json({
      success: true,
      message: "✅ PR berhasil dibuat di KANBAN_TRACKING",
      values,
    });
  } catch (err: any) {
    console.error("POST /api/kanban error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// --- PATCH → update PR → PO → Receipt ---
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = body.payload ?? body;

    const sheets = createSheetsClient();

    // baca data tracking
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.sheet_id!,
      range: `KANBAN_TRACKING!A:U`,
    });
    const rows = resp.data.values || [];
    if (rows.length === 0)
      return NextResponse.json({ success: false, error: "Sheet kosong" }, { status: 404 });

    const data = rows.slice(1);

    // cari row berdasarkan PR (kolom B = index 1)
    const targetIndex = data.findIndex(
      (r) => (r[1] || "").toString().trim() === (payload.noPr || "").toString().trim()
    );
    if (targetIndex === -1)
      return NextResponse.json({ success: false, error: "PR tidak ditemukan" }, { status: 404 });

    const targetRowNumber = targetIndex + 2; // header + offset

    const updates: Array<{ range: string; values: any[][] }> = [];

    // update PO
    if (payload.po)
      updates.push({ range: `KANBAN_TRACKING!D${targetRowNumber}`, values: [[payload.po]] });
    if (payload.tanggalpo)
      updates.push({ range: `KANBAN_TRACKING!E${targetRowNumber}`, values: [[payload.tanggalpo]] });
    if (payload.harga)
      updates.push({ range: `KANBAN_TRACKING!M${targetRowNumber}`, values: [[payload.harga]] });
    if (payload.leadtime)
      updates.push({ range: `KANBAN_TRACKING!O${targetRowNumber}`, values: [[payload.leadtime]] });
    if (payload.eta)
      updates.push({ range: `KANBAN_TRACKING!P${targetRowNumber}`, values: [[payload.eta]] });

    // update Receipt
      if (payload.tanggalreceipt)
        updates.push({ range: `KANBAN_TRACKING!Q${targetRowNumber}`, values: [[payload.tanggalreceipt]] });
      if (payload.noreceipt)
        updates.push({ range: `KANBAN_TRACKING!R${targetRowNumber}`, values: [[payload.noreceipt]] });

      // status otomatis
      if (payload.status) {
        updates.push({ range: `KANBAN_TRACKING!S${targetRowNumber}`, values: [[payload.status]] });
      } else if (payload.po) {
        updates.push({ range: `KANBAN_TRACKING!S${targetRowNumber}`, values: [["Completed"]] });
      } else if (payload.tanggalreceipt) {
        updates.push({ range: `KANBAN_TRACKING!S${targetRowNumber}`, values: [["Selesai"]] });
        updates.push({ range: `KANBAN_TRACKING!T${targetRowNumber}`, values: [[new Date().toISOString().split("T")[0]]] }); // simpan tanggal selesai
      }

    if (updates.length === 0)
      return NextResponse.json({ success: false, error: "Tidak ada field yang diupdate" }, { status: 400 });

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: process.env.sheet_id!,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: updates,
      },
    });

    return NextResponse.json({ success: true, message: "Updated", updates });
  } catch (err: any) {
    console.error("PATCH /api/kanban error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}