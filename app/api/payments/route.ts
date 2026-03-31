import { NextRequest, NextResponse } from "next/server"
import { getAllRows, appendRow, getNextId, deleteRow, updateRow } from "@/lib/sheets"
import { validatePayment } from "@/lib/validators"
import { Payment } from "@/types"

function rowToPayment(row: string[]): Payment {
  return {
    id: row[0] || "",
    member_id: row[1] || "",
    type: (row[2] as "maintenance" | "event") || "maintenance",
    event_id: row[3] || "",
    amount: parseFloat(row[4]) || 0,
    status: (row[5] as "paid" | "pending") || "pending",
    date: row[6] || "",
    period: row[7] || "",
    payment_mode: row[8] || "",
  }
}

export async function GET() {
  try {
    const rows = await getAllRows("Payments")
    const payments = rows.map(rowToPayment)
    return NextResponse.json({ success: true, data: payments })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const error = await validatePayment(body)
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 })
    }

    const id = await getNextId("Payments")
    const row: string[] = [
      id,
      body.member_id,
      body.type,
      body.event_id || "",
      String(body.amount),
      body.status,
      body.date,
      body.period || "",
      body.payment_mode || "",
    ]
    await appendRow("Payments", row)

    const payment: Payment = {
      id,
      member_id: body.member_id,
      type: body.type,
      event_id: body.event_id || "",
      amount: Number(body.amount),
      status: body.status,
      date: body.date,
      period: body.period || "",
      payment_mode: body.payment_mode || "",
    }
    return NextResponse.json({ success: true, data: payment }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

// PATCH — update payment status (mark as paid), date, payment_mode
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, date, payment_mode } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })
    }

    const rows = await getAllRows("Payments")
    const dataIndex = rows.findIndex((row) => row[0] === id)
    if (dataIndex === -1) {
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 })
    }

    const row = [...rows[dataIndex]]
    // Ensure row has enough columns
    while (row.length < 9) row.push("")

    if (status) row[5] = status
    if (date) row[6] = date
    if (payment_mode) row[8] = payment_mode

    await updateRow("Payments", dataIndex, row)

    const payment = rowToPayment(row)
    return NextResponse.json({ success: true, data: payment })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })

    await deleteRow("Payments", id)
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
