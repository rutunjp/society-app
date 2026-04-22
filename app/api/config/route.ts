import { NextResponse } from "next/server"
import { hasAuthFailure, requireAppContext } from "@/lib/auth"
import { upsertSocietyConfig } from "@/lib/society-config.server"

export async function GET() {
  const appContext = await requireAppContext("view_society")
  if (hasAuthFailure(appContext)) return appContext.response

  return NextResponse.json({ success: true, data: appContext.society })
}

export async function POST(request: Request) {
  const appContext = await requireAppContext("manage_society")
  if (hasAuthFailure(appContext)) return appContext.response

  try {
    const body = await request.json()
    const society = {
      ...appContext.society,
      ...body,
      id: appContext.user.society_id,
    }

    await upsertSocietyConfig(society)
    return NextResponse.json({ success: true, data: society })
  } catch {
    return NextResponse.json({ success: false, error: "Failed to write config" }, { status: 500 })
  }
}
