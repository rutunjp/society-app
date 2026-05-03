import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validatePayment } from "@/lib/validators"

export async function POST(req: NextRequest) {
  try {
    const { payments } = await req.json()
    if (!Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json({ success: false, error: "Payments array is required" }, { status: 400 })
    }

    // Validate all payments
    for (const p of payments) {
      const error = await validatePayment(p)
      if (error) {
        return NextResponse.json({ success: false, error: `Validation failed: ${error}` }, { status: 400 })
      }
    }

    const supabase = createClient()
    const recordsToInsert = payments.map((p: any) => ({
      society_id: p.society_id,
      member_id: p.member_id,
      type: p.type,
      event_id: p.event_id || null,
      amount: Number(p.amount),
      status: p.status,
      date: p.date,
      period: p.period || null,
      payment_mode: p.payment_mode || null,
    }))

    const { error } = await supabase
      .from("payments")
      .insert(recordsToInsert)

    if (error) throw error

    return NextResponse.json({ success: true, count: recordsToInsert.length })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Unknown error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { updates } = await req.json()
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ success: false, error: "Updates array is required" }, { status: 400 })
    }

    const supabase = createClient()
    let updatedCount = 0

    // Since Supabase RPC or bulk update by id isn't natively straightforward without a custom function,
    // and this list is usually small (e.g. 50-100 items), we can map over them.
    for (const update of updates) {
      const { id, society_id, status, date, payment_mode } = update
      if (!id || !society_id) continue

      const updatePayload: any = {}
      if (status) updatePayload.status = status
      if (date) updatePayload.date = date
      if (payment_mode) updatePayload.payment_mode = payment_mode

      const { error } = await supabase
        .from("payments")
        .update(updatePayload)
        .eq("id", id)
        .eq("society_id", society_id)

      if (!error) updatedCount++
    }

    return NextResponse.json({ success: true, count: updatedCount })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Unknown error" }, { status: 500 })
  }
}
