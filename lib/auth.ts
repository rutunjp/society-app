import { cookies } from "next/headers"

export function isAuthenticated(): boolean {
  const cookieStore = cookies()
  const session = cookieStore.get("session")
  return session?.value === "authenticated"
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin123"
}
