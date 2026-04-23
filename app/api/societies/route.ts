import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()

    // We only need to fetch societies the user belongs to.
    // The RLS policy on societies already restricts this based on society_users.
    const { data: societies, error } = await supabase
      .from("societies")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data: societies })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Unknown error" }, { status: 500 })
  }
}
