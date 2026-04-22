import { NextRequest, NextResponse } from "next/server"
import { getAllRows, appendRow, getNextId, deleteRow, updateRowById } from "@/lib/sheets"
import { hasAuthFailure, requireAppContext } from "@/lib/auth"
import { getSocietyConfigStore } from "@/lib/society-config.server"
import { rowBelongsToSociety, withSocietyId } from "@/lib/tenant"
import { validateMember } from "@/lib/validators"
import { Member } from "@/types"

const MEMBER_SOCIETY_COLUMN = 6

function rowToMember(row: string[]): Member {
  return {
    id: row[0] || "",
    society_id: row[6] || "",
    name: row[1] || "",
    flat_no: row[2] || "",
    phone: row[3] || "",
    email: row[4] || "",
    type: (row[5] as "owner" | "tenant") || "owner",
  }
}

export async function GET() {
  const appContext = await requireAppContext("view_members")
  if (hasAuthFailure(appContext)) return appContext.response

  try {
    const { defaultSocietyId } = await getSocietyConfigStore()
    const rows = await getAllRows("Members")
    const members = rows
      .filter((row) =>
        rowBelongsToSociety(
          row,
          appContext.user.society_id,
          MEMBER_SOCIETY_COLUMN,
          defaultSocietyId
        )
      )
      .map((row) => ({
        ...rowToMember(row),
        society_id: row[6] || defaultSocietyId,
      }))
    return NextResponse.json({ success: true, data: members })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const appContext = await requireAppContext("manage_members")
  if (hasAuthFailure(appContext)) return appContext.response

  try {
    const body = await req.json()
    const payload = { ...body, society_id: appContext.user.society_id }
    const error = await validateMember(payload)
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
      body.email || "",
      body.type,
    ]
    await appendRow(
      "Members",
      withSocietyId(row, appContext.user.society_id, MEMBER_SOCIETY_COLUMN)
    )

    const member: Member = {
      id,
      society_id: appContext.user.society_id,
      name: body.name,
      flat_no: body.flat_no,
      phone: body.phone,
      email: body.email || "",
      type: body.type,
    }
    return NextResponse.json({ success: true, data: member }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const appContext = await requireAppContext("manage_members")
  if (hasAuthFailure(appContext)) return appContext.response

  try {
    const { defaultSocietyId } = await getSocietyConfigStore()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })

    const body = await req.json()
    const rows = await getAllRows("Members")
    const existingRow = rows.find(
      (row) =>
        row[0] === id &&
        rowBelongsToSociety(
          row,
          appContext.user.society_id,
          MEMBER_SOCIETY_COLUMN,
          defaultSocietyId
        )
    )
    if (!existingRow) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 })
    }

    const payload = { ...body, society_id: appContext.user.society_id }
    const error = await validateMember(payload, id)
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 })
    }

    const row: string[] = [
      id,
      body.name,
      body.flat_no,
      body.phone,
      body.email || "",
      body.type,
    ]
    await updateRowById(
      "Members",
      id,
      withSocietyId(row, appContext.user.society_id, MEMBER_SOCIETY_COLUMN)
    )

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const appContext = await requireAppContext("manage_members")
  if (hasAuthFailure(appContext)) return appContext.response

  try {
    const { defaultSocietyId } = await getSocietyConfigStore()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })

    const rows = await getAllRows("Members")
    const existingRow = rows.find(
      (row) =>
        row[0] === id &&
        rowBelongsToSociety(
          row,
          appContext.user.society_id,
          MEMBER_SOCIETY_COLUMN,
          defaultSocietyId
        )
    )
    if (!existingRow) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 })
    }

    await deleteRow("Members", id)
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
