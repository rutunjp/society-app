import { NextRequest, NextResponse } from "next/server"
import { getAllRows, appendRow, getNextId, deleteRow, updateRow } from "@/lib/sheets"
import { hasAuthFailure, requireAppContext } from "@/lib/auth"
import { getSocietyConfigStore } from "@/lib/society-config.server"
import { rowBelongsToSociety, withSocietyId } from "@/lib/tenant"
import { validateExpense } from "@/lib/validators"
import { Expense } from "@/types"

const EXPENSE_SOCIETY_COLUMN = 6

function rowToExpense(row: string[]): Expense {
  return {
    id: row[0] || "",
    society_id: row[6] || "",
    event_id: row[1] || "",
    title: row[2] || "",
    amount: parseFloat(row[3]) || 0,
    notes: row[4] || "",
    category: row[5] || "",
  }
}

export async function GET() {
  const appContext = await requireAppContext("view_expenses")
  if (hasAuthFailure(appContext)) return appContext.response

  try {
    const { defaultSocietyId } = await getSocietyConfigStore()
    const rows = await getAllRows("Expenses")
    const expenses = rows
      .filter((row) =>
        rowBelongsToSociety(
          row,
          appContext.user.society_id,
          EXPENSE_SOCIETY_COLUMN,
          defaultSocietyId
        )
      )
      .map((row) => ({
        ...rowToExpense(row),
        society_id: row[6] || defaultSocietyId,
      }))
    return NextResponse.json({ success: true, data: expenses })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const appContext = await requireAppContext("manage_expenses")
  if (hasAuthFailure(appContext)) return appContext.response

  try {
    const body = await req.json()
    const error = await validateExpense({ ...body, society_id: appContext.user.society_id })
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
      body.category || "",
    ]
    await appendRow(
      "Expenses",
      withSocietyId(row, appContext.user.society_id, EXPENSE_SOCIETY_COLUMN)
    )

    const expense: Expense = {
      id,
      society_id: appContext.user.society_id,
      event_id: body.event_id,
      title: body.title,
      amount: Number(body.amount),
      notes: body.notes || "",
      category: body.category || "",
    }
    return NextResponse.json({ success: true, data: expense }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const appContext = await requireAppContext("manage_expenses")
  if (hasAuthFailure(appContext)) return appContext.response

  try {
    const { defaultSocietyId } = await getSocietyConfigStore()
    const body = await req.json()
    const { id, title, amount, notes, category } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "ID required for update" }, { status: 400 })
    }

    const rows = await getAllRows("Expenses")
    const dataIndex = rows.findIndex(
      (row) =>
        row[0] === id &&
        rowBelongsToSociety(
          row,
          appContext.user.society_id,
          EXPENSE_SOCIETY_COLUMN,
          defaultSocietyId
        )
    )
    if (dataIndex === -1) {
      return NextResponse.json({ success: false, error: "Expense not found" }, { status: 404 })
    }

    const row = [...rows[dataIndex]]
    // Ensure row has enough columns
    while (row.length < 6) row.push("")

    if (title !== undefined) row[2] = title
    if (amount !== undefined) row[3] = String(amount)
    if (notes !== undefined) row[4] = notes
    if (category !== undefined) row[5] = category

    await updateRow(
      "Expenses",
      dataIndex,
      withSocietyId(row, appContext.user.society_id, EXPENSE_SOCIETY_COLUMN)
    )

    const updatedExpense = rowToExpense(
      withSocietyId(row, appContext.user.society_id, EXPENSE_SOCIETY_COLUMN)
    )
    return NextResponse.json({ success: true, data: updatedExpense })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const appContext = await requireAppContext("manage_expenses")
  if (hasAuthFailure(appContext)) return appContext.response

  try {
    const { defaultSocietyId } = await getSocietyConfigStore()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })

    const rows = await getAllRows("Expenses")
    const existingRow = rows.find(
      (row) =>
        row[0] === id &&
        rowBelongsToSociety(
          row,
          appContext.user.society_id,
          EXPENSE_SOCIETY_COLUMN,
          defaultSocietyId
        )
    )
    if (!existingRow) {
      return NextResponse.json({ success: false, error: "Expense not found" }, { status: 404 })
    }

    await deleteRow("Expenses", id)
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
