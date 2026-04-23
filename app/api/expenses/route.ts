import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateExpense } from "@/lib/validators"
import { Expense } from "@/types"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const societyId = searchParams.get("society_id")

    if (!societyId) {
      return NextResponse.json({ success: false, error: "society_id required" }, { status: 400 })
    }

    const supabase = createClient()
    const { data: expenses, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("society_id", societyId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: expenses })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Unknown error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const errorMsg = await validateExpense(body)
    if (errorMsg) {
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 })
    }

    const supabase = createClient()
    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        society_id: body.society_id,
        event_id: body.event_id,
        title: body.title,
        amount: Number(body.amount),
        notes: body.notes || null,
        category: body.category,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: expense }, { status: 201 })
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
    const errorMsg = await validateExpense(body)
    if (errorMsg) {
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 })
    }

    const supabase = createClient()
    const { error } = await supabase
      .from("expenses")
      .update({
        event_id: body.event_id,
        title: body.title,
        amount: Number(body.amount),
        notes: body.notes || null,
        category: body.category,
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
      .from("expenses")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Unknown error" }, { status: 500 })
  }
}
