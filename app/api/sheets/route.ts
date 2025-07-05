import { NextResponse } from "next/server";
import { google } from "googleapis";

const credentials = {
  type: process.env.type!,
  project_id: process.env.project_id!,
  private_key_id: process.env.private_key_id!,
  private_key: process.env.private_key!,
  client_email: process.env.account_email!,
  universe_domain: process.env.universe_domain!,
};

const glAuth = new google.auth.GoogleAuth({
  projectId: process.env.project_id!,
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const glSheet = google.sheets({ version: "v4", auth: glAuth });

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const worksheetName = searchParams.get("worksheet") || "Sheet1";
    const machineFilter = searchParams.get("machine");
    const statusFilter = searchParams.get("status");
    const range = searchParams.get("range") || "A:Z";

    const data = await glSheet.spreadsheets.values.get({
      spreadsheetId: process.env.sheet_id!,
      range: `${worksheetName}!${range}`,
    });

    const rows: string[][] = data.data.values || [];

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

    const headers: string[] = rows[headerRowIndex];
    const dataRows: string[][] = rows.slice(headerRowIndex + 1);

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
      // Debug info (hapus di production)
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
      { success: false, error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
