import { NextRequest, NextResponse } from "next/server"
import { hasAuthFailure, requireAppContext } from "@/lib/auth"
import { ROLE_OPTIONS } from "@/lib/rbac"
import { createUser, deleteUser, getSocietyUsers, updateUser } from "@/lib/users"
import { UserRole } from "@/types"

function isValidRole(role: string): role is UserRole {
  return ROLE_OPTIONS.some((option) => option.value === role)
}

export async function GET() {
  const appContext = await requireAppContext("manage_users")
  if (hasAuthFailure(appContext)) return appContext.response

  const users = await getSocietyUsers(appContext.user.society_id)
  return NextResponse.json({ success: true, data: users })
}

export async function POST(req: NextRequest) {
  const appContext = await requireAppContext("manage_users")
  if (hasAuthFailure(appContext)) return appContext.response

  try {
    const body = await req.json()
    if (!body.name?.trim() || !body.email?.trim() || !isValidRole(body.role)) {
      return NextResponse.json(
        { success: false, error: "Name, email, and a valid role are required" },
        { status: 400 }
      )
    }

    const user = await createUser({
      society_id: appContext.user.society_id,
      name: body.name.trim(),
      email: body.email.trim(),
      role: body.role,
      status: "invited",
    })

    return NextResponse.json({ success: true, data: user }, { status: 201 })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to add user"
    const status = message.includes("already registered") ? 409 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

export async function PATCH(req: NextRequest) {
  const appContext = await requireAppContext("manage_users")
  if (hasAuthFailure(appContext)) return appContext.response

  try {
    const body = await req.json()
    if (!body.id || !body.name?.trim() || !isValidRole(body.role)) {
      return NextResponse.json(
        { success: false, error: "User id, name, and a valid role are required" },
        { status: 400 }
      )
    }

    const societyUsers = await getSocietyUsers(appContext.user.society_id)
    const existingUser = societyUsers.find((user) => user.id === body.id)
    if (!existingUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const presidents = societyUsers.filter((user) => user.role === "president")
    if (
      existingUser.role === "president" &&
      body.role !== "president" &&
      presidents.length === 1
    ) {
      return NextResponse.json(
        { success: false, error: "Each society must keep at least one President / Chairperson" },
        { status: 400 }
      )
    }

    const updatedUser = await updateUser({
      id: body.id,
      name: body.name.trim(),
      role: body.role,
    })

    return NextResponse.json({ success: true, data: updatedUser })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to update user"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const appContext = await requireAppContext("manage_users")
  if (hasAuthFailure(appContext)) return appContext.response

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("id")
  if (!userId) {
    return NextResponse.json({ success: false, error: "User id is required" }, { status: 400 })
  }

  const societyUsers = await getSocietyUsers(appContext.user.society_id)
  const existingUser = societyUsers.find((user) => user.id === userId)
  if (!existingUser) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
  }

  const presidents = societyUsers.filter((user) => user.role === "president")
  if (existingUser.role === "president" && presidents.length === 1) {
    return NextResponse.json(
      { success: false, error: "Each society must keep at least one President / Chairperson" },
      { status: 400 }
    )
  }

  await deleteUser(userId)
  return NextResponse.json({ success: true })
}
