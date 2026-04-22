import { NextResponse } from "next/server"
import { hasAuthFailure, requireAppContext, requireAuthenticatedSession } from "@/lib/auth"
import { getRoleLabel } from "@/lib/rbac"

export async function GET() {
  const sessionResult = await requireAuthenticatedSession()
  if (hasAuthFailure(sessionResult)) return sessionResult.response

  const appContext = await requireAppContext()
  if (hasAuthFailure(appContext)) {
    return NextResponse.json(
      {
        success: false,
        error: "Society onboarding required",
        needsOnboarding: true,
        sessionUser: {
          email: sessionResult.email,
          name: sessionResult.name,
        },
      },
      { status: 403 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      currentUser: {
        ...appContext.user,
        roleLabel: getRoleLabel(appContext.user.role),
      },
      activeSociety: appContext.society,
      sessionUser: {
        email: sessionResult.email,
        name: sessionResult.name,
      },
    },
  })
}
