import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export async function getGoogleSheet(): Promise<GoogleSpreadsheet> {
  const doc = new GoogleSpreadsheet(process.env.SHEET_ID!, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
}
