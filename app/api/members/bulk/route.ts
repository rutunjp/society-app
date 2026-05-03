import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
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

    const supabase = createClient()
    const recordsToInsert = members.map((m: any) => ({
      society_id: m.society_id,
      name: m.name,
      flat_no: m.flat_no,
      phone: m.phone || null,
      email: m.email || null,
      type: m.type || "owner",
    }))

    const { data: resultingMembers, error } = await supabase
      .from("members")
      .insert(recordsToInsert)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data: resultingMembers }, { status: 201 })

  } catch (e: any) {
    const msg = e.message || "Unknown error processing bulk upload"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
