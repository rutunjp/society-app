import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const societyId = searchParams.get("society_id")

    if (!societyId) {
      return NextResponse.json({ success: false, error: "society_id required" }, { status: 400 })
    }

    const supabase = createClient()
    const { data: society, error } = await supabase
      .from("societies")
      .select("*")
      .eq("id", societyId)
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, ...society })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Unknown error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, subtitle, address, email, logo, maintenance_amount, governing_body, executive_members } = body

    if (!id) {
       return NextResponse.json({ success: false, error: "society_id required" }, { status: 400 })
    }

    const supabase = createClient()
    const { error } = await supabase
      .from("societies")
      .update({
        name,
        subtitle,
        address,
        email,
        logo,
        maintenance_amount: Number(maintenance_amount),
        governing_body,
        executive_members,
      })
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Unknown error" }, { status: 500 })
  }
}
