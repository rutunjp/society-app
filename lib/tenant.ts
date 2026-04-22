import { DEFAULT_SOCIETY_ID } from "@/lib/society-config"

export function getSocietyIdFromRequest(request: Request): string {
  const url = new URL(request.url)
  return (
    request.headers.get("x-society-id") ||
    url.searchParams.get("societyId") ||
    DEFAULT_SOCIETY_ID
  )
}

export function getRowSocietyId(
  row: string[],
  societyColumnIndex: number,
  defaultSocietyId: string
): string {
  return row[societyColumnIndex] || defaultSocietyId
}

export function rowBelongsToSociety(
  row: string[],
  societyId: string,
  societyColumnIndex: number,
  defaultSocietyId: string
): boolean {
  return getRowSocietyId(row, societyColumnIndex, defaultSocietyId) === societyId
}

export function withSocietyId(
  row: string[],
  societyId: string,
  societyColumnIndex: number
): string[] {
  const nextRow = [...row]
  while (nextRow.length <= societyColumnIndex) nextRow.push("")
  nextRow[societyColumnIndex] = societyId
  return nextRow
}
