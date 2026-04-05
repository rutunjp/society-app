import { NextRequest, NextResponse } from "next/server"
import { getAllRows, appendRows, getNextId, updateRow } from "@/lib/sheets"
import { validatePayment } from "@/lib/validators"
import { Payment } from "@/types"

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

    // Get starting ID
    const nextIdStr = await getNextId("Payments")
    let currentId = parseInt(nextIdStr, 10)

    const rows: string[][] = payments.map((p) => {
      const id = String(currentId++)
      return [
        id,
        p.member_id,
        p.type,
        p.event_id || "",
        String(p.amount),
        p.status,
        p.date,
        p.period || "",
        p.payment_mode || "",
      ]
    })

    await appendRows("Payments", rows)

    return NextResponse.json({ success: true, count: rows.length })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { updates } = await req.json()
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ success: false, error: "Updates array is required" }, { status: 400 })
    }

    const rows = await getAllRows("Payments")
    
    // We update row by row for now, but we do it in parallel for speed if needed.
    // However, Google Sheets API might rate limit if we do too many individual requests.
    // For a bulk maintenance mark-as-paid, usually it's < 50-100 flats.
    
    for (const update of updates) {
      const { id, status, date, payment_mode } = update
      if (!id) continue

      const dataIndex = rows.findIndex((row) => row[0] === id)
      if (dataIndex === -1) continue

      const row = [...rows[dataIndex]]
      while (row.length < 9) row.push("")

      if (status) row[5] = status
      if (date) row[6] = date
      if (payment_mode) row[8] = payment_mode

      await updateRow("Payments", dataIndex, row)
    }

    return NextResponse.json({ success: true, count: updates.length })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
