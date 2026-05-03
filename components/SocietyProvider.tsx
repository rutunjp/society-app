"use client"
import React, { createContext, useContext, useEffect, useState } from "react"
import { Society } from "@/types"

interface SocietyContextType {
  activeSociety: Society | null
  setActiveSociety: (society: Society) => void
  societies: Society[]
  setSocieties: (societies: Society[]) => void
  loading: boolean
}

const SocietyContext = createContext<SocietyContextType>({
  activeSociety: null,
  setActiveSociety: () => {},
  societies: [],
  setSocieties: () => {},
  loading: true,
})

export function SocietyProvider({ children }: { children: React.ReactNode }) {
  const [activeSociety, setActiveSocietyState] = useState<Society | null>(null)
  const [societies, setSocieties] = useState<Society[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSocieties() {
      try {
        const res = await fetch("/api/societies")
        const data = await res.json()
        if (data.success && data.data.length > 0) {
          setSocieties(data.data)

          // Try to restore from localStorage
          const savedId = localStorage.getItem("activeSocietyId")
          const savedSociety = data.data.find((s: Society) => s.id === savedId)

          if (savedSociety) {
            setActiveSocietyState(savedSociety)
          } else {
            setActiveSocietyState(data.data[0])
            localStorage.setItem("activeSocietyId", data.data[0].id)
          }
        }
      } catch (err) {
        console.error("Failed to load societies:", err)
      } finally {
        setLoading(false)
      }
    }
    loadSocieties()
  }, [])

  const setActiveSociety = (society: Society) => {
    setActiveSocietyState(society)
    localStorage.setItem("activeSocietyId", society.id)
  }

  return (
    <SocietyContext.Provider value={{ activeSociety, setActiveSociety, societies, setSocieties, loading }}>
      {children}
    </SocietyContext.Provider>
  )
}

export function useSociety() {
  return useContext(SocietyContext)
}
