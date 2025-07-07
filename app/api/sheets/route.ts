import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const worksheetName = searchParams.get("worksheet") || "Sheet1";
    const machineFilter = searchParams.get("machine");
    const statusFilter = searchParams.get("status");
    const range = searchParams.get("range") || "A:Z";

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

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.sheet_id!,
      range: `${worksheetName}!${range}`,
    });

    const rows = response.data.values || [];

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const headerRowIndex = rows.findIndex(
      (row) => row && row.some((cell) => cell && cell.trim() !== "")
    );

    if (headerRowIndex === -1) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const headers = rows[headerRowIndex];
    const dataRows = rows.slice(headerRowIndex + 1);

    const jsonData = dataRows.map((row) => {
      return headers.reduce((obj, header, index) => {
        if (header && header.trim()) {
          const normalizedHeader = header.toLowerCase().replace(/\s+/g, "");
          obj[normalizedHeader] = row[index] || "";
        }
        return obj;
      }, {} as Record<string, string>);
    });

    let filteredData = jsonData;

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

        if (itemMachine === filterMachine) {
          return true;
        }

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
