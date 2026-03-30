import { NextRequest, NextResponse } from "next/server"
import { getAllRows, appendRow, getNextId, deleteRow } from "@/lib/sheets"
import { validateMember } from "@/lib/validators"
import { Member } from "@/types"

function rowToMember(row: string[]): Member {
  return {
    id: row[0] || "",
    name: row[1] || "",
    flat_no: row[2] || "",
    phone: row[3] || "",
    email: row[4] || "",
    type: (row[5] as "owner" | "tenant") || "owner",
  }
}

export async function GET() {
  try {
    const rows = await getAllRows("Members")
    const members = rows.map(rowToMember)
    return NextResponse.json({ success: true, data: members })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const error = await validateMember(body)
    if (error) {
      const status = error.includes("already exists") ? 409 : 400
      return NextResponse.json({ success: false, error }, { status })
    }

    const id = await getNextId("Members")
    const row: string[] = [
      id,
      body.name,
      body.flat_no,
      body.phone,
      body.email,
      body.type,
    ]
    await appendRow("Members", row)

    const member: Member = {
      id,
      name: body.name,
      flat_no: body.flat_no,
      phone: body.phone,
      email: body.email,
      type: body.type,
    }
    return NextResponse.json({ success: true, data: member }, { status: 201 })
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

    await deleteRow("Members", id)
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
