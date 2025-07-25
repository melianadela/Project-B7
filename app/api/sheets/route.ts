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
  statusFilter?: string
) {
  let filteredData = data;

  if (statusFilter) {
    filteredData = filteredData.filter((item) => {
      const itemStatus = item.status?.trim().toLowerCase();
      const filterStatus = statusFilter.trim().toLowerCase();
      return itemStatus === filterStatus;
    });
  }

  if (machineFilter) {
    filteredData = filteredData.filter((item) => {
      const itemMachine = item.mesin?.trim().toLowerCase();
      const filterMachine = machineFilter.trim().toLowerCase();

      if (itemMachine === filterMachine) return true;

      if (/^\d+$/.test(filterMachine)) {
        const escapedFilter = filterMachine.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );
        const regex = new RegExp(`\\b${escapedFilter}\\b`, "i");
        return regex.test(itemMachine);
      }

      return itemMachine?.includes(filterMachine);
    });
  }

  return filteredData;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const worksheetName = searchParams.get("worksheet") || "Sheet1";
    const machineFilter = searchParams.get("machine");
    const statusFilter = searchParams.get("status");
    const range = searchParams.get("range") || "A:Z";

    const sheets = createSheetsClient();

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
      },
    });
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data dari spreadsheet" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const worksheetName = searchParams.get("worksheet") || "Sheet1";
    const kodepart = searchParams.get("kodepart");

    console.log("kodepart:", kodepart); // Debug log

    // Validasi kodepart
    if (!kodepart || kodepart.trim() === "") {
      return NextResponse.json(
        { success: false, error: "kodepart parameter is required" },
        { status: 400 }
      );
    }

    const sheets = createSheetsClient();

    // Ambil semua data untuk mencari baris dengan kodepart yang sesuai
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.sheet_id!,
      range: `${worksheetName}!A:Z`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Sheet kosong" },
        { status: 404 }
      );
    }

    // Cari kolom kodepart (asumsi kolom A, bisa disesuaikan)
    const headerRow = rows[1];
    const kodepartColumnIndex = headerRow.findIndex((header) =>
      header?.toLowerCase().trim().includes("kode")
    );

    if (kodepartColumnIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Kolom kodepart tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cari baris dengan kodepart yang sesuai (mulai dari baris 2, index 1)
    const targetRows: number[] = [];
    for (let i = 1; i < rows.length; i++) {
      const rowKodepart = rows[i][kodepartColumnIndex]?.toString().trim();
      if (rowKodepart === kodepart) {
        targetRows.push(i + 1); // +1 karena sheet dimulai dari 1
      }
    }

    if (targetRows.length === 0) {
      return NextResponse.json(
        { success: false, error: `Kodepart '${kodepart}' tidak ditemukan` },
        { status: 404 }
      );
    }

    // Kolom K, L, M (index 10, 11, 12)
    const columnIndexes = [10, 11, 12]; // K, L, M
    const columnNames = ["Untuk Bulan", "Status", "Deadline Pemesanan"];

    // Siapkan batch update untuk kolom K, L, M
    const batchUpdateRequests = [];

    for (const rowNumber of targetRows) {
      // Kolom K - kosongkan
      batchUpdateRequests.push({
        range: `${worksheetName}!K${rowNumber}`,
        values: [[""]],
      });

      // Kolom L - isi dengan "✅ Cukup"
      batchUpdateRequests.push({
        range: `${worksheetName}!L${rowNumber}`,
        values: [["✅ Cukup"]],
      });

      // Kolom M - kosongkan
      batchUpdateRequests.push({
        range: `${worksheetName}!M${rowNumber}`,
        values: [[""]],
      });
    }

    // Execute batch update
    const batchResponse = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: process.env.sheet_id!,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: batchUpdateRequests,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${kodepart} berhasil di update`,
    });
  } catch (error) {
    console.error("Error clearing columns:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengosongkan kolom" },
      { status: 500 }
    );
  }
}
