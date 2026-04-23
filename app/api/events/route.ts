import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateEvent } from "@/lib/validators"
import { Event } from "@/types"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const societyId = searchParams.get("society_id")

    if (!societyId) {
      return NextResponse.json({ success: false, error: "society_id required" }, { status: 400 })
    }

    const supabase = createClient()
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .eq("society_id", societyId)
      .order("date", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: events })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Unknown error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const errorMsg = await validateEvent(body)
    if (errorMsg) {
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 })
    }

    const supabase = createClient()
    const { data: event, error } = await supabase
      .from("events")
      .insert({
        society_id: body.society_id,
        name: body.name,
        expected_amount: Number(body.expected_amount),
        date: body.date,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: event }, { status: 201 })
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
    const errorMsg = await validateEvent(body)
    if (errorMsg) {
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 })
    }

    const supabase = createClient()
    const { error } = await supabase
      .from("events")
      .update({
        name: body.name,
        expected_amount: Number(body.expected_amount),
        date: body.date,
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
      .from("events")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Unknown error" }, { status: 500 })
  }
}
