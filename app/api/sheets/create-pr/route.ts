import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";

function createSheetsClient() {
  const credentials = {
    type: "service_account",
    project_id: process.env.project_id!,
    private_key_id: process.env.private_key_id!,
    private_key: process.env.private_key!.replace(/\n/g, "\n"),
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, noPr, codePart, part, formMonth, quantity, uom, vendor } =
      body;

    const sheets = createSheetsClient();

    const po = "";
    const kanbanType = body.kanbanType || "INTERNAL";
    const satuan = "";
    const harga = "";
    const tanggalpr = "";
    const tanggalpo = "";
    const leadtime = "";
    const eta = "";
    const tanggalreceipt = "";
    const noreceipt = "";
    const status = "PR Process";
    const keterangan = "";
    const pic = "";

    const values = [
      date,
      noPr,
      po,
      kanbanType,
      codePart,
      part,
      formMonth,
      quantity,
      uom,
      satuan,
      harga,
      vendor,
      tanggalpr,
      tanggalpo,
      leadtime,
      eta,
      tanggalreceipt,
      noreceipt,
      status,
      keterangan,
      pic,
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.sheet_id!,
      range: "KANBAN_TRACKING",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [values],
      },
    });

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("Error adding data to sheet:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menambahkan data ke spreadsheet" },
      { status: 500 }
    );
  }
}
