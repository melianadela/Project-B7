import { NextResponse } from "next/server";
import { getGoogleSheet } from "@/lib/google-sheets";

export async function GET() {
  try {
    const doc = await getGoogleSheet();
    console.log(doc);
    const sheet = doc.sheetsByTitle["SIG"];
    const rows = await sheet.getRows();

    const data = rows.map((row) => row.toObject());

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching kanban data:", error);
    return NextResponse.json(
      { error: "Failed to fetch kanban data" },
      { status: 500 }
    );
  }
}
