import { NextRequest, NextResponse } from "next/server"
import { hasAuthFailure, requireAppContext } from "@/lib/auth"
import { getNextId, appendRows } from "@/lib/sheets"
import { withSocietyId } from "@/lib/tenant"
import { validateMember } from "@/lib/validators"
import { Member } from "@/types"

const MEMBER_SOCIETY_COLUMN = 6

export async function POST(req: NextRequest) {
  const appContext = await requireAppContext("manage_members")
  if (hasAuthFailure(appContext)) return appContext.response

  try {
    const body = await req.json()
    const { members } = body
    
    if (!members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json({ success: false, error: "Missing or invalid members array" }, { status: 400 })
    }

    // Validate individually (basic structure validation)
    for (const m of members) {
      const error = await validateMember({ ...m, society_id: appContext.user.society_id })
      if (error) {
         // return first validation error caught
         return NextResponse.json({ success: false, error: `Row error for ${m.name || "Unknown"}: ${error}` }, { status: 400 })
      }
    }

    // Get the next starting ID
    let currentId = parseInt(await getNextId("Members"), 10)
    
    // Convert to row arrays
    const rows: string[][] = []
    const resultingMembers: Member[] = []

    for (const m of members) {
      const id = String(currentId++)
      rows.push(withSocietyId([
        id,
        m.name,
        m.flat_no,
        m.phone || "",
        m.email || "",
        m.type || "owner",
      ], appContext.user.society_id, MEMBER_SOCIETY_COLUMN))
      
      resultingMembers.push({
        id,
        society_id: appContext.user.society_id,
        name: m.name,
        flat_no: m.flat_no,
        phone: m.phone || "",
        email: m.email || "",
        type: m.type || "owner",
      })
    }

    await appendRows("Members", rows)

    return NextResponse.json({ success: true, data: resultingMembers }, { status: 201 })

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error processing bulk upload"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
