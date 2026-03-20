import crypto from "node:crypto";
import { google } from "googleapis";

const PUBLIC_SHEET_HEADERS = [
  "No",
  "Nama",
  "Penyelenggara",
  "Tanggal Pendaftaran (close)",
  "Tanggal Penyisihan",
  "Link ig",
  "Linktree",
  "Link Guidebook",
  "Link Regis",
  "Yang Daftar & Leader",
  "Sudah Daftar",
  "Sudah Menang",
  "Link Poster"
];

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getSheetName() {
  return process.env.GOOGLE_SHEET_NAME || "on going and soon";
}

function getCloudinaryFolder() {
  return process.env.CLOUDINARY_FOLDER || "iris-competition-center/posters";
}

function getGoogleAuth() {
  const clientEmail = getRequiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = getRequiredEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
}

function getSheetsClient() {
  return google.sheets({
    version: "v4",
    auth: getGoogleAuth()
  });
}

function getSpreadsheetId() {
  return getRequiredEnv("GOOGLE_SHEET_ID");
}

async function getNextRowNumber(sheets, spreadsheetId, sheetName) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'!A2:A`
  });

  const values = response.data.values || [];
  const numericValues = values
    .map(([value]) => Number.parseInt(String(value || "").trim(), 10))
    .filter((value) => Number.isFinite(value));

  return numericValues.length ? Math.max(...numericValues) + 1 : 1;
}

export async function uploadPosterToCloudinary(file) {
  const cloudName = getRequiredEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = getRequiredEnv("CLOUDINARY_API_KEY");
  const apiSecret = getRequiredEnv("CLOUDINARY_API_SECRET");
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = getCloudinaryFolder();
  const signatureBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(signatureBase).digest("hex");

  const arrayBuffer = await file.arrayBuffer();
  const uploadFormData = new FormData();
  uploadFormData.set("file", new Blob([arrayBuffer], { type: file.type || "application/octet-stream" }), file.name);
  uploadFormData.set("api_key", apiKey);
  uploadFormData.set("timestamp", String(timestamp));
  uploadFormData.set("folder", folder);
  uploadFormData.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: uploadFormData
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Cloudinary upload failed: ${errorBody}`);
  }

  const result = await response.json();
  return result.secure_url;
}

export async function appendCompetitionToSheet(payload) {
  const spreadsheetId = getSpreadsheetId();
  const sheetName = getSheetName();
  const sheets = getSheetsClient();
  const nextNumber = await getNextRowNumber(sheets, spreadsheetId, sheetName);

  const rowValues = [
    nextNumber,
    payload.name,
    payload.organizer,
    payload.registrationDeadline,
    payload.preliminaryDate,
    payload.instagramLink,
    payload.linktree,
    payload.guidebookLink,
    payload.registrationLink,
    "",
    "FALSE",
    "FALSE",
    payload.posterLink
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${sheetName}'!A:M`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      majorDimension: "ROWS",
      values: [rowValues]
    }
  });

  return {
    rowNumber: nextNumber,
    sheetName,
    headers: PUBLIC_SHEET_HEADERS
  };
}

export async function getAdminCompetitions() {
  const spreadsheetId = getSpreadsheetId();
  const sheetName = getSheetName();
  const sheets = getSheetsClient();

  const [sheetResponse, valuesResponse] = await Promise.all([
    sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties"
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A2:M`
    })
  ]);

  const sheetProperties = sheetResponse.data.sheets?.find(
    (sheet) => sheet.properties?.title === sheetName
  )?.properties;

  if (!sheetProperties?.sheetId && sheetProperties?.sheetId !== 0) {
    throw new Error(`Sheet "${sheetName}" tidak ditemukan.`);
  }

  const values = valuesResponse.data.values || [];

  return values
    .map((row, index) => ({
      rowIndex: index + 2,
      no: row[0] || "",
      name: row[1] || "",
      organizer: row[2] || "",
      registrationDeadline: row[3] || "",
      preliminaryDate: row[4] || "",
      instagramLink: row[5] || "",
      linktree: row[6] || "",
      guidebookLink: row[7] || "",
      registrationLink: row[8] || "",
      posterLink: row[12] || ""
    }))
    .filter((item) => item.name)
    .sort((a, b) => Number(a.no || 0) - Number(b.no || 0))
    .map((item) => ({
      ...item,
      sheetId: sheetProperties.sheetId
    }));
}

export async function deleteCompetitionRow(rowIndex) {
  const spreadsheetId = getSpreadsheetId();
  const sheetName = getSheetName();
  const sheets = getSheetsClient();
  const sheetResponse = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties"
  });

  const sheetProperties = sheetResponse.data.sheets?.find(
    (sheet) => sheet.properties?.title === sheetName
  )?.properties;

  if (!sheetProperties?.sheetId && sheetProperties?.sheetId !== 0) {
    throw new Error(`Sheet "${sheetName}" tidak ditemukan.`);
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetProperties.sheetId,
              dimension: "ROWS",
              startIndex: rowIndex - 1,
              endIndex: rowIndex
            }
          }
        }
      ]
    }
  });

  return true;
}

export function normalizeCompetitionSubmission(input) {
  return {
    name: String(input.name || "").trim(),
    organizer: String(input.organizer || "").trim(),
    registrationDeadline: String(input.registrationDeadline || "").trim(),
    preliminaryDate: String(input.preliminaryDate || "").trim(),
    instagramLink: String(input.instagramLink || "").trim(),
    linktree: String(input.linktree || "").trim(),
    guidebookLink: String(input.guidebookLink || "").trim(),
    registrationLink: String(input.registrationLink || "").trim(),
    posterLink: String(input.posterLink || "").trim()
  };
}

export function validateCompetitionSubmission(payload) {
  const errors = [];

  if (!payload.name) errors.push("Nama lomba wajib diisi.");
  if (!payload.organizer) errors.push("Penyelenggara wajib diisi.");
  if (!payload.registrationDeadline) errors.push("Tanggal pendaftaran wajib diisi.");

  return errors;
}
