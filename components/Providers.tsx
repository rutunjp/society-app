"use client"
import { SocietyProvider } from "./SocietyProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return <SocietyProvider>{children}</SocietyProvider>
}
