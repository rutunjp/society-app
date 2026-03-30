import { NextRequest, NextResponse } from "next/server"
import { getAdminPassword } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    const adminPassword = getAdminPassword()

    if (password !== adminPassword) {
      return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set("session", "authenticated", {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      sameSite: "lax",
    })
    return response
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete("session")
  return response
}
