import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validatePayment } from "@/lib/validators"
import { Payment } from "@/types"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const societyId = searchParams.get("society_id")

    if (!societyId) {
      return NextResponse.json({ success: false, error: "society_id required" }, { status: 400 })
    }

    const supabase = createClient()
    const { data: payments, error } = await supabase
      .from("payments")
      .select("*")
      .eq("society_id", societyId)
      .order("date", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: payments })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Unknown error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const errorMsg = await validatePayment(body)
    if (errorMsg) {
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 })
    }

    const supabase = createClient()
    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        society_id: body.society_id,
        member_id: body.member_id,
        type: body.type,
        event_id: body.event_id || null,
        amount: Number(body.amount),
        status: body.status,
        date: body.date,
        period: body.period || null,
        payment_mode: body.payment_mode || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: payment }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Unknown error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  // Not used in original, but keeping signature for completeness. PATCH is mostly used.
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })

    const body = await req.json()
    const errorMsg = await validatePayment(body)
    if (errorMsg) {
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 })
    }

    const supabase = createClient()
    const { error } = await supabase
      .from("payments")
      .update({
        member_id: body.member_id,
        type: body.type,
        event_id: body.event_id || null,
        amount: Number(body.amount),
        status: body.status,
        date: body.date,
        period: body.period || null,
        payment_mode: body.payment_mode || null,
      })
      .eq("id", id)
      .eq("society_id", body.society_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Unknown error" }, { status: 500 })
  }
}

// PATCH — update payment status (mark as paid), date, payment_mode
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, society_id, status, date, payment_mode } = body

    if (!id || !society_id) {
      return NextResponse.json({ success: false, error: "id and society_id required" }, { status: 400 })
    }

    const updates: Partial<Payment> = {}
    if (status) updates.status = status
    if (date) updates.date = date
    if (payment_mode) updates.payment_mode = payment_mode

    const supabase = createClient()
    const { data: payment, error } = await supabase
      .from("payments")
      .update(updates)
      .eq("id", id)
      .eq("society_id", society_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: payment })
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
      .from("payments")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Unknown error" }, { status: 500 })
  }
}
