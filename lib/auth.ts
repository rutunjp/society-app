import { getServerSession, NextAuthOptions, Session } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { NextResponse } from "next/server"
import { getSocietyById } from "@/lib/society-config.server"
import { activateUserForSignIn, findUserByEmail } from "@/lib/users"
import { can, Permission } from "@/lib/rbac"
import { AppUser, SocietySummary } from "@/types"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      await activateUserForSignIn({
        email: user.email,
        name: user.name,
      })
      return true
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_dev_mode_only",
}

export interface AuthenticatedSessionResult {
  session: Session
  email: string
  name: string
}

export interface AppContextResult {
  session: Session
  user: AppUser
  society: SocietySummary
}

export interface AuthFailureResult {
  response: NextResponse
}

export function hasAuthFailure(
  result: AuthFailureResult | AppContextResult | AuthenticatedSessionResult
): result is AuthFailureResult {
  return "response" in result
}

export async function requireAuthenticatedSession(): Promise<
  AuthenticatedSessionResult | AuthFailureResult
> {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.trim().toLowerCase()

  if (!session || !email) {
    return {
      response: NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ),
    }
  }

  return {
    session,
    email,
    name: session.user?.name || "",
  }
}

export async function requireAppContext(
  permission?: Permission
): Promise<AppContextResult | AuthFailureResult> {
  const sessionResult = await requireAuthenticatedSession()
  if (hasAuthFailure(sessionResult)) return sessionResult

  const user = await findUserByEmail(sessionResult.email)
  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, error: "Society onboarding required", needsOnboarding: true },
        { status: 403 }
      ),
    }
  }

  if (permission && !can(user.role, permission)) {
    return {
      response: NextResponse.json(
        { success: false, error: "You do not have permission for this action" },
        { status: 403 }
      ),
    }
  }

  const society = await getSocietyById(user.society_id)

  return {
    session: sessionResult.session,
    user,
    society,
  }
}
