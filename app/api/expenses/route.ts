import { NextRequest, NextResponse } from "next/server"
import { getAllRows, appendRow, getNextId, deleteRow } from "@/lib/sheets"
import { validateExpense } from "@/lib/validators"
import { Expense } from "@/types"

function rowToExpense(row: string[]): Expense {
  return {
    id: row[0] || "",
    event_id: row[1] || "",
    title: row[2] || "",
    amount: parseFloat(row[3]) || 0,
    notes: row[4] || "",
  }
}

export async function GET() {
  try {
    const rows = await getAllRows("Expenses")
    const expenses = rows.map(rowToExpense)
    return NextResponse.json({ success: true, data: expenses })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const error = await validateExpense(body)
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 })
    }

    const id = await getNextId("Expenses")
    const row: string[] = [
      id,
      body.event_id,
      body.title,
      String(body.amount),
      body.notes || "",
    ]
    await appendRow("Expenses", row)

    const expense: Expense = {
      id,
      event_id: body.event_id,
      title: body.title,
      amount: Number(body.amount),
      notes: body.notes || "",
    }
    return NextResponse.json({ success: true, data: expense }, { status: 201 })
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

    await deleteRow("Expenses", id)
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
