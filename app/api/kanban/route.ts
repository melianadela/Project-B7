import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";

/**
 * Robust Kanban API untuk:
 * - GET ?type=external/internal → baca KANBAN_EKSTERNAL / KANBAN_INTERNAL
 * - POST → append ke KANBAN_TRACKING (buat PR baru)
 * - PATCH → update data di KANBAN_TRACKING (PR → PO → Receipt)
 *
 * ENV wajib:
 * - sheet_id
 * - project_id
 * - private_key (replace \n dengan newline)
 * - private_key_id
 * - account_email
 * - client_id
 */

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

function normalizeKey(h: string) {
  return (h || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/** Read range dari worksheet */
async function readSheetRange(sheetName: string, range = "A:Z") {
  const sheets = createSheetsClient();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.sheet_id!,
    range: `${sheetName}!${range}`,
  });
  return resp.data.values || [];
}

/** Process rows: deteksi header + normalisasi */
function processRows(rows: any[][]) {
  if (!rows || rows.length === 0) {
    return {
      headerRowIndex: -1,
      headers: [],
      dataRows: [],
      normalizedHeaderMap: {} as Record<string, number>,
      normalized: [] as Record<string, any>[],
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
      normalized: [] as Record<string, any>[],
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
      return { __sheetRow: sheetRowNumber, ...obj };
    })
    .filter(Boolean) as Record<string, any>[];

  return { headerRowIndex, headers, dataRows, normalizedHeaderMap, normalized };
}

/** Worksheet resolver */
function worksheetForType(type?: string) {
  if (!type) return "KANBAN_EKSTERNAL";
  const t = String(type).toLowerCase();
  if (t.includes("internal")) return "KANBAN_INTERNAL";
  return "KANBAN_EKSTERNAL";
}

/** GET */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "external";
    const worksheet = worksheetForType(type);

    const rows = await readSheetRange(worksheet, "A1:R1000");
    const processed = processRows(rows);

    return NextResponse.json({
      success: true,
      worksheet,
      totalRows: processed.dataRows.length,
      data: processed.normalized,
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

/** POST → append PR ke KANBAN_TRACKING */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = (body && body.payload) ? body.payload : body;

    const sheets = createSheetsClient();
    const targetRange = "KANBAN_TRACKING";

    const values = [
      payload.date ?? "",            // Tanggal
      payload.noPr ?? "",            // PR
      payload.tanggalpr ?? "",       // Tanggal PR
      payload.po ?? "",              // PO
      payload.tanggalpo ?? "",       // Tanggal PO
      payload.kanbanType ?? "EXTERNAL",
      payload.codePart ?? "",
      payload.part ?? "",
      payload.formMonth ?? "",
      payload.quantity ?? "",
      payload.uom ?? "",
      payload.satuan ?? "",
      payload.harga ?? "",
      payload.vendor ?? "",
      payload.leadtime ?? "",
      payload.eta ?? "",
      payload.tanggalreceipt ?? "",
      payload.noreceipt ?? "",
      payload.status ?? "PR Dibuat",
      payload.keterangan ?? "",
      payload.pic ?? "",
    ];

    const appendResp = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.sheet_id!,
      range: targetRange,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });

    return NextResponse.json({ success: true, appended: appendResp.data });
  } catch (err: any) {
    console.error("POST /api/kanban error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Unknown" },
      { status: 500 }
    );
  }
}

/** PATCH → update data di KANBAN_TRACKING */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = body.payload ?? body;

    const sheets = createSheetsClient();

    // Baca semua tracking
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.sheet_id!,
      range: `KANBAN_TRACKING!A:Z`,
    });
    const rows = resp.data.values || [];
    if (rows.length === 0)
      return NextResponse.json({ success: false, error: "KANBAN_TRACKING empty" }, { status: 404 });

    const processed = processRows(rows);
    const headerToIndex = processed.normalizedHeaderMap;

    // Tentukan row target
    let targetRowNumber: number | null = null;
    if (payload.sheetRow) {
      targetRowNumber = Number(payload.sheetRow);
    } else if (payload.noPr) {
      const foundIndex = processed.normalized.findIndex((r: any) => {
        const candidate = (r.nopr || r["no_pr"] || r.prno || r.pr || "").toString().trim();
        return candidate === payload.noPr.toString().trim();
      });
      if (foundIndex !== -1) targetRowNumber = processed.headerRowIndex + 2 + foundIndex;
    }

    if (!targetRowNumber) {
      return NextResponse.json(
        { success: false, error: "Target row not found. Provide sheetRow or matching noPr." },
        { status: 404 }
      );
    }

    const updates: Array<{ range: string; values: any[][] }> = [];

    const setCellByHeaderCandidates = (candidates: string[], value: string) => {
      for (const c of candidates) {
        const idx = headerToIndex[normalizeKey(c)];
        if (idx !== undefined) {
          let col = idx + 1;
          let letter = "";
          while (col > 0) {
            const rem = (col - 1) % 26;
            letter = String.fromCharCode(65 + rem) + letter;
            col = Math.floor((col - 1) / 26);
          }
          updates.push({ range: `KANBAN_TRACKING!${letter}${targetRowNumber}`, values: [[value]] });
          return true;
        }
      }
      return false;
    };

    // Update kolom status/progress
    if (payload.status) setCellByHeaderCandidates(["status"], payload.status);
    if (payload.po) setCellByHeaderCandidates(["po"], payload.po);
    if (payload.tanggalpo) setCellByHeaderCandidates(["tanggalpo", "tanggal_po"], payload.tanggalpo);
    if (payload.tanggalreceipt) setCellByHeaderCandidates(["tanggalreceipt", "tanggal_receipt"], payload.tanggalreceipt);
    if (payload.noreceipt) setCellByHeaderCandidates(["noreceipt", "no_receipt"], payload.noreceipt);
    if (payload.eta) setCellByHeaderCandidates(["eta"], payload.eta);

    if (updates.length === 0)
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });

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
    return NextResponse.json(
      { success: false, error: err.message || "Unknown" },
      { status: 500 }
    );
  }
}
