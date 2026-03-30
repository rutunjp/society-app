import { google } from "googleapis"

// Parse service account from env
function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT env var is missing")
  const credentials = JSON.parse(raw)
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })
}

function getSheetId(): string {
  const id = process.env.SHEET_ID
  if (!id) throw new Error("SHEET_ID env var is missing")
  return id
}

// Returns all data rows (excludes header row 1)
export async function getAllRows(sheetName: string): Promise<string[][]> {
  const auth = getAuth()
  const sheets = google.sheets({ version: "v4", auth })
  const spreadsheetId = getSheetId()

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:Z`,  // starts from row 2 to skip header
  })

  return (response.data.values as string[][]) || []
}

// Appends one row to the sheet
export async function appendRow(sheetName: string, row: string[]): Promise<void> {
  const auth = getAuth()
  const sheets = google.sheets({ version: "v4", auth })
  const spreadsheetId = getSheetId()

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [row],
    },
  })
}

// Updates a specific row by its 0-based data index (NOT the sheet row number)
// dataIndex 0 = sheet row 2 (row 1 is header)
export async function updateRow(
  sheetName: string,
  dataIndex: number,
  row: string[]
): Promise<void> {
  const auth = getAuth()
  const sheets = google.sheets({ version: "v4", auth })
  const spreadsheetId = getSheetId()

  const sheetRowNumber = dataIndex + 2  // +1 for header, +1 for 1-based index

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A${sheetRowNumber}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [row],
    },
  })
}

// Returns the next auto-increment ID as a string
export async function getNextId(sheetName: string): Promise<string> {
  const rows = await getAllRows(sheetName)
  if (!rows || rows.length === 0) return "1"
  // Find highest ID instead of just last row, as rows might be deleted
  const ids = rows.map(r => parseInt(r[0], 10)).filter(id => !isNaN(id))
  if (ids.length === 0) return "1"
  return String(Math.max(...ids) + 1)
}

// Deletes a row by its primary ID
export async function deleteRow(sheetName: string, id: string): Promise<void> {
  const auth = getAuth()
  const sheets = google.sheets({ version: "v4", auth })
  const spreadsheetId = getSheetId()

  const sheetMetadata = await sheets.spreadsheets.get({ spreadsheetId })
  const sheet = sheetMetadata.data.sheets?.find(s => s.properties?.title === sheetName)
  if (!sheet || sheet.properties?.sheetId === undefined) {
    throw new Error(`Sheet ${sheetName} not found`)
  }
  
  const rows = await getAllRows(sheetName)
  const rowIndex = rows.findIndex(row => row[0] === id)
  if (rowIndex === -1) {
    throw new Error(`Record with ID ${id} not found`)
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheet.properties.sheetId,
            dimension: "ROWS",
            startIndex: rowIndex + 1, // +1 for header
            endIndex: rowIndex + 2,
          },
        },
      }],
    },
  })
}
