import { NextRequest, NextResponse } from "next/server"
import { getNextId, appendRows } from "@/lib/sheets"
import { validateMember } from "@/lib/validators"
import { Member } from "@/types"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { members } = body
    
    if (!members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json({ success: false, error: "Missing or invalid members array" }, { status: 400 })
    }

    // Validate individually (basic structure validation)
    for (const m of members) {
      const error = await validateMember(m)
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
      rows.push([
        id,
        m.name,
        m.flat_no,
        m.phone || "",
        m.email || "",
        m.type || "owner",
      ])
      
      resultingMembers.push({
        id,
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
