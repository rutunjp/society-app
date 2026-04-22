import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedSession, hasAuthFailure } from "@/lib/auth"
import { createEmptySocietyConfig, slugifySocietyId } from "@/lib/society-config"
import { getSocietyConfigStore, upsertSocietyConfig } from "@/lib/society-config.server"
import { createUser, ensureCoreDataSheets, findUserByEmail } from "@/lib/users"

export async function POST(req: NextRequest) {
  const sessionResult = await requireAuthenticatedSession()
  if (hasAuthFailure(sessionResult)) return sessionResult.response

  const existingUser = await findUserByEmail(sessionResult.email)
  if (existingUser) {
    return NextResponse.json(
      { success: false, error: "This Google account is already registered to a society" },
      { status: 409 }
    )
  }

  try {
    const body = await req.json()
    const societyName = body.name?.trim()
    const maintenanceAmount = Number(body.maintenanceAmount || 0)

    if (!societyName || !body.address?.trim()) {
      return NextResponse.json(
        { success: false, error: "Society name and address are required" },
        { status: 400 }
      )
    }

    const societyId = slugifySocietyId(societyName)
    const store = await getSocietyConfigStore()
    if (store.societies.some((society) => society.id === societyId)) {
      return NextResponse.json(
        { success: false, error: "A society with this name already exists" },
        { status: 409 }
      )
    }

    await ensureCoreDataSheets()

    const society = {
      id: societyId,
      ...createEmptySocietyConfig(),
      name: societyName,
      subtitle: body.subtitle?.trim() || "",
      address: body.address.trim(),
      email: body.email?.trim() || sessionResult.email,
      logo: body.logo?.trim() || societyName.slice(0, 10).toUpperCase(),
      maintenanceAmount: Number.isFinite(maintenanceAmount) ? maintenanceAmount : 0,
    }

    await upsertSocietyConfig(society)

    const user = await createUser({
      society_id: societyId,
      name: sessionResult.name || body.adminName?.trim() || "Society Head",
      email: sessionResult.email,
      role: "president",
      status: "active",
    })

    return NextResponse.json({
      success: true,
      data: {
        currentUser: user,
        activeSociety: society,
      },
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to onboard society"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
