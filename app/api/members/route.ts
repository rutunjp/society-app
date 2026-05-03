import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateMember } from "@/lib/validators"
import { Member } from "@/types"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const societyId = searchParams.get("society_id")

    if (!societyId) {
      return NextResponse.json({ success: false, error: "society_id required" }, { status: 400 })
    }

    const supabase = createClient()
    const { data: members, error } = await supabase
      .from("members")
      .select("*")
      .eq("society_id", societyId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: members })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Unknown error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const errorMsg = await validateMember(body)
    if (errorMsg) {
      const status = errorMsg.includes("already exists") ? 409 : 400
      return NextResponse.json({ success: false, error: errorMsg }, { status })
    }

    const supabase = createClient()
    const { data: member, error } = await supabase
      .from("members")
      .insert({
        society_id: body.society_id,
        name: body.name,
        flat_no: body.flat_no,
        phone: body.phone,
        email: body.email || null,
        type: body.type,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: member }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Unknown error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })

    const body = await req.json()
    const errorMsg = await validateMember(body, id)
    if (errorMsg) {
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 })
    }

    const supabase = createClient()
    const { error } = await supabase
      .from("members")
      .update({
        name: body.name,
        flat_no: body.flat_no,
        phone: body.phone,
        email: body.email || null,
        type: body.type,
      })
      .eq("id", id)
      .eq("society_id", body.society_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Unknown error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })

    const supabase = createClient()
    const { error } = await supabase
      .from("members")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Unknown error" }, { status: 500 })
  }
}
