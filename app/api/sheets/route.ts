import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";

function createSheetsClient() {
  const credentials = {
    type: "service_account",
    project_id: process.env.project_id!,
    private_key_id: process.env.private_key_id!,
    private_key: process.env.private_key!.replace(/\\n/g, "\n"),
    client_email: process.env.account_email!,
    client_id: process.env.client_id!,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(
      process.env.account_email!
    )}`,
    universe_domain: "googleapis.com",
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

function processSheetData(rows: any[][]) {
  if (rows.length === 0) return [];

  const headerRowIndex = rows.findIndex(
    (row) => row && row.some((cell) => cell && cell.trim() !== "")
  );

  if (headerRowIndex === -1) return [];

  const headers = rows[headerRowIndex];
  const dataRows = rows.slice(headerRowIndex + 1);

  return dataRows.map((row) => {
    return headers.reduce((obj, header, index) => {
      if (header && header.trim()) {
        const normalizedHeader = header.toLowerCase().replace(/\s+/g, "");
        obj[normalizedHeader] = row[index] || "";
      }
      return obj;
    }, {} as Record<string, string>);
  });
}

function applyFilters(
  data: any[],
  machineFilter?: string,
  statusFilter?: string,
  worksheetName?: string
) {
  let filteredData = data;

  if (statusFilter) {
    filteredData = filteredData.filter((item) => {
      const itemStatus = (item.status || "").toLowerCase().trim();
      const filterStatus = statusFilter.toLowerCase().trim();
      return itemStatus === filterStatus;
    });
  }

  // 💥 Filter mesin tapi jangan terlalu ketat
  if (machineFilter && machineFilter.toLowerCase() !== "all") {
    const normalizedMachine = machineFilter.toLowerCase().trim();

    filteredData = filteredData.filter((item) => {
      const itemMachine = (item.mesin || "").toLowerCase().trim();

      // case 1: match persis
      if (itemMachine === normalizedMachine) return true;

      // case 2: machineFilter adalah subset dari itemMachine (ex: "ilapak" → "ilapak 1")
      if (itemMachine.includes(normalizedMachine)) return true;

      // case 3: worksheet name match sebagian
      const worksheet = (worksheetName || "").toLowerCase().trim();
      if (worksheet && itemMachine.includes(worksheet)) return true;

      return false;
    });
  }

  return filteredData;
}

// Helper function to verify worksheet exists
async function verifyWorksheet(sheets: any, spreadsheetId: string, worksheetName: string) {
  try {
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title'
    });
    
    const worksheetTitles = metadata.data.sheets?.map((sheet: any) => sheet.properties.title) || [];
    return worksheetTitles.includes(worksheetName);
  } catch (error) {
    console.error("Error verifying worksheet:", error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const worksheetName = searchParams.get("worksheet") || "Sheet1";
    const machineFilter = searchParams.get("machine");
    const statusFilter = searchParams.get("status");
    const range = searchParams.get("range") || "A:Z";

    const sheets = createSheetsClient();

    // Verify worksheet exists before making the request
    const worksheetExists = await verifyWorksheet(sheets, process.env.sheet_id!, worksheetName);
    if (!worksheetExists) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Worksheet '${worksheetName}' tidak ditemukan. Periksa nama worksheet di Google Sheet.` 
        },
        { status: 404 }
      );
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.sheet_id!,
      range: `${worksheetName}!${range}`,
    });

    const rows = response.data.values || [];
    const jsonData = processSheetData(rows);
    const filteredData = applyFilters(
      jsonData,
      machineFilter ?? undefined,
      statusFilter ?? undefined
    );

    return NextResponse.json({
      success: true,
      data: filteredData,
      debug: {
        totalRows: jsonData.length,
        filteredRows: filteredData.length,
        appliedFilters: {
          machine: machineFilter,
          status: statusFilter,
        },
        worksheet: worksheetName
      },
    });
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    
    // Better error handling with specific messages
    if (error instanceof Error && error.message.includes("Unable to parse range")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Nama worksheet tidak valid atau tidak ditemukan. Periksa nama worksheet di Google Sheet." 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data dari spreadsheet" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const worksheetNameRaw = searchParams.get("worksheet") || "Sheet1";
    const kodepart = searchParams.get("kodepart");
    const body = await request.json();
    const tanggalBaru = body.tanggalPenggantianTerakhir;

    if (!kodepart || !tanggalBaru) {
      return NextResponse.json(
        { success: false, error: "Kodepart dan tanggal wajib diisi" },
        { status: 400 }
      );
    }

    // 🔎 Bersihkan nama worksheet dari karakter tak terlihat
    const cleanWorksheet = worksheetNameRaw.replace(/\u00A0/g, " ").trim();

    // 🧠 Pastikan format range valid
    const rangeGet = `'${cleanWorksheet}'!A:Z`;
    console.log("🧾 Worksheet yang dikirim:", JSON.stringify(cleanWorksheet));
    console.log("📏 Range get:", rangeGet);

    const sheets = createSheetsClient();

    // 🧪 Tes dulu apakah Google Sheets bisa akses worksheet ini
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.sheet_id!,
        range: rangeGet,
      });
    } catch (e: any) {
      console.error("❌ TEST FAILED GET:", e.message);
      throw new Error(`Tidak bisa akses range '${rangeGet}'. Cek nama sheet atau karakter tersembunyi.`);
    }

    // Kalau GET berhasil, baru lanjut ambil data
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.sheet_id!,
      range: rangeGet,
    });

    const rows = resp.data.values || [];

    const headerRowIndex = rows.findIndex(
      (r) =>
        r.some((cell) =>
          ["kode", "penggantian", "mesin"].some((k) =>
            (cell || "").toLowerCase().includes(k)
          )
        )
    );
    if (headerRowIndex === -1)
      throw new Error("Header tidak ditemukan dalam sheet");

    const headerRow = rows[headerRowIndex];
    const kodepartIdx = headerRow.findIndex((h) =>
      (h || "").toLowerCase().includes("kode")
    );
    const penggantianTerakhirIdx = headerRow.findIndex((h) =>
      (h || "").toLowerCase().includes("penggantian terakhir")
    );

    if (kodepartIdx === -1 || penggantianTerakhirIdx === -1)
      throw new Error("Kolom 'Kode' atau 'Penggantian Terakhir' tidak ditemukan");

    const targetRow = rows.findIndex(
      (r) => (r[kodepartIdx] || "").trim() === kodepart.trim()
    );

    if (targetRow === -1) {
      return NextResponse.json(
        { success: false, error: `Kodepart '${kodepart}' tidak ditemukan` },
        { status: 404 }
      );
    }

    const targetCell = `'${cleanWorksheet}'!${String.fromCharCode(
      65 + penggantianTerakhirIdx
    )}${targetRow + 1}`;
    console.log("✅ Target cell:", targetCell);

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.sheet_id!,
      range: targetCell,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[tanggalBaru]] },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PATCH ERROR:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          err.message || "Gagal memperbarui tanggal penggantian terakhir",
      },
      { status: 500 }
    );
  }
}


