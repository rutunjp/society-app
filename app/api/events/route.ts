import { NextRequest, NextResponse } from "next/server"
import { getAllRows, appendRow, getNextId, deleteRow } from "@/lib/sheets"
import { hasAuthFailure, requireAppContext } from "@/lib/auth"
import { getSocietyConfigStore } from "@/lib/society-config.server"
import { rowBelongsToSociety, withSocietyId } from "@/lib/tenant"
import { validateEvent } from "@/lib/validators"
import { Event } from "@/types"

const EVENT_SOCIETY_COLUMN = 4

function rowToEvent(row: string[]): Event {
  return {
    id: row[0] || "",
    society_id: row[4] || "",
    name: row[1] || "",
    expected_amount: parseFloat(row[2]) || 0,
    date: row[3] || "",
  }
}

export async function GET() {
  const appContext = await requireAppContext("view_events")
  if (hasAuthFailure(appContext)) return appContext.response

  try {
    const { defaultSocietyId } = await getSocietyConfigStore()
    const rows = await getAllRows("Events")
    const events = rows
      .filter((row) =>
        rowBelongsToSociety(
          row,
          appContext.user.society_id,
          EVENT_SOCIETY_COLUMN,
          defaultSocietyId
        )
      )
      .map((row) => ({
        ...rowToEvent(row),
        society_id: row[4] || defaultSocietyId,
      }))
    return NextResponse.json({ success: true, data: events })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const appContext = await requireAppContext("manage_events")
  if (hasAuthFailure(appContext)) return appContext.response

  try {
    const body = await req.json()
    const error = await validateEvent({ ...body, society_id: appContext.user.society_id })
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 })
    }

    const id = await getNextId("Events")
    const row: string[] = [
      id,
      body.name,
      String(body.expected_amount),
      body.date,
    ]
    await appendRow(
      "Events",
      withSocietyId(row, appContext.user.society_id, EVENT_SOCIETY_COLUMN)
    )

    const event: Event = {
      id,
      society_id: appContext.user.society_id,
      name: body.name,
      expected_amount: Number(body.expected_amount),
      date: body.date,
    }
    return NextResponse.json({ success: true, data: event }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const appContext = await requireAppContext("manage_events")
  if (hasAuthFailure(appContext)) return appContext.response

  try {
    const { defaultSocietyId } = await getSocietyConfigStore()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })

    const rows = await getAllRows("Events")
    const existingRow = rows.find(
      (row) =>
        row[0] === id &&
        rowBelongsToSociety(
          row,
          appContext.user.society_id,
          EVENT_SOCIETY_COLUMN,
          defaultSocietyId
        )
    )
    if (!existingRow) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 })
    }

    await deleteRow("Events", id)
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
