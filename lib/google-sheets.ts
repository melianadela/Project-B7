"use server";

import { google } from "googleapis";

export async function getSheetData() {
  const glAuth = await google.auth.getClient({
    projectId: process.env.project_id!,
    credentials: {
      type: process.env.type!,
      project_id: process.env.project_id!,
      private_key_id: process.env.private_key_id!,
      private_key: process.env.private_key!,
      client_email: process.env.account_email!,
      universe_domain: process.env.universe_domain!,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const glSheet = google.sheets({ version: "v4", auth: glAuth });

  const data = await glSheet.spreadsheets.values.get({
    spreadsheetId: process.env.sheet_id!,
    range: "RANGE",
  });

  return {
    data: data.data.values,
  };
}
