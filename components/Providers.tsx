"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { SessionProvider, useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import LoadingSpinner from "@/components/LoadingSpinner"
import { can, Permission } from "@/lib/rbac"
import { AppUser, SocietySummary } from "@/types"

interface SocietyContextValue {
  activeSociety: SocietySummary | null
  currentUser: AppUser | null
  sessionUser: {
    email: string
    name: string
  } | null
  loading: boolean
  needsOnboarding: boolean
  refreshAppContext: () => Promise<void>
  hasPermission: (permission: Permission) => boolean
}

const SocietyContext = createContext<SocietyContextValue | null>(null)

function SocietyProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [activeSociety, setActiveSociety] = useState<SocietySummary | null>(null)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null)
  const [sessionUser, setSessionUser] = useState<{ email: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  const refreshAppContext = useCallback(async () => {
    if (status !== "authenticated") {
      setActiveSociety(null)
      setCurrentUser(null)
      setSessionUser(null)
      setNeedsOnboarding(false)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/me", { cache: "no-store" })
      const payload = await res.json()

      if (!payload.success && payload.needsOnboarding) {
        setActiveSociety(null)
        setCurrentUser(null)
        setSessionUser(payload.sessionUser || null)
        setNeedsOnboarding(true)
        if (pathname !== "/onboarding") {
          router.replace("/onboarding")
        }
        return
      }

      if (payload.success && payload.data) {
        setCurrentUser(payload.data.currentUser)
        setActiveSociety(payload.data.activeSociety)
        setSessionUser(payload.data.sessionUser || null)
        setNeedsOnboarding(false)
        if (pathname === "/onboarding") {
          router.replace("/dashboard")
        }
      }
    } finally {
      setLoading(false)
    }
  }, [pathname, router, status])

  useEffect(() => {
    refreshAppContext()
  }, [refreshAppContext])

  const hasPermission = useCallback(
    (permission: Permission) => {
      if (!currentUser) return false
      return can(currentUser.role, permission)
    },
    [currentUser]
  )

  if (status === "loading" || (status === "authenticated" && loading)) {
    return <LoadingSpinner />
  }

  const value: SocietyContextValue = {
    activeSociety,
    currentUser,
    sessionUser,
    loading,
    needsOnboarding,
    refreshAppContext,
    hasPermission,
  }

  return <SocietyContext.Provider value={value}>{children}</SocietyContext.Provider>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SocietyProvider>{children}</SocietyProvider>
    </SessionProvider>
  )
}

export function useSociety() {
  const context = useContext(SocietyContext)
  if (!context) {
    throw new Error("useSociety must be used within Providers")
  }

  return context
}
