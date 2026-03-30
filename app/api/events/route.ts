import { NextRequest, NextResponse } from "next/server"
import { getAllRows, appendRow, getNextId, deleteRow } from "@/lib/sheets"
import { validateEvent } from "@/lib/validators"
import { Event } from "@/types"

function rowToEvent(row: string[]): Event {
  return {
    id: row[0] || "",
    name: row[1] || "",
    expected_amount: parseFloat(row[2]) || 0,
    date: row[3] || "",
  }
}

export async function GET() {
  try {
    const rows = await getAllRows("Events")
    const events = rows.map(rowToEvent)
    return NextResponse.json({ success: true, data: events })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const error = await validateEvent(body)
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
    await appendRow("Events", row)

    const event: Event = {
      id,
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
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })

    await deleteRow("Events", id)
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
