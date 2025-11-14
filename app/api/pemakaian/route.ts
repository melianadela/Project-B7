import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: process.env.type,
        project_id: process.env.project_id,
        private_key_id: process.env.private_key_id,
        private_key: process.env.private_key?.replace(/\\n/g, "\n"),
        client_email: process.env.account_email,
        client_id: process.env.client_id,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.sheet_id,
      range: "PENGGUNAAN KANBAN EKSTERNAL!A1:Z2000",
    });

    const rows = res.data.values || [];

    const data: any[] = [];
    let currentMonth = "";

    for (let row of rows) {
      const colA = row[0]?.trim();

      // Jika kolom A mengandung nama bulan, jadikan bulan aktif
      if (
        colA &&
        ["JANUARI","FEBRUARI","MARET","APRIL","MEI","JUNI","JULI","AGUSTUS","SEPTEMBER","OKTOBER","NOVEMBER","DESEMBER"]
          .includes(colA.toUpperCase())
      ) {
        currentMonth = colA;
      }

      // Skip row kosong
      if (!row[1] && !row[2] && !row[3] && !row[4]) continue;

      // Jika belum ada bulan → skip
      if (!currentMonth) continue;

      // C = suku cadang, B = kode part, D = mesin, E = qty
      data.push({
        tanggal: currentMonth,          // tidak ada tanggal, jadi pakai bulan
        kodepart: row[1] || "",
        part: row[2] || "",
        mesin: row[3] || "",
        qty_pemakaian: Number(row[4]) || 0,
      });
    }

    return NextResponse.json({
      success: true,
      total: data.length,
      data,
    });
  } catch (err: any) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
