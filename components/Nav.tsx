"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  UsersIcon,
  CurrencyRupeeIcon,
  CalendarDaysIcon,
  ReceiptPercentIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline"

const navItems = [
  { href: "/", label: "Dashboard", icon: HomeIcon },
  { href: "/members", label: "Members", icon: UsersIcon },
  { href: "/maintenance", label: "Maintenance", icon: BanknotesIcon },
  { href: "/payments", label: "Payments", icon: CurrencyRupeeIcon },
  { href: "/events", label: "Events", icon: CalendarDaysIcon },
  { href: "/expenses", label: "Expenses", icon: ReceiptPercentIcon },
]

import { signOut } from "next-auth/react"

export default function Nav() {
  const pathname = usePathname()

  async function handleLogout() {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 h-screen bg-gray-900 text-white flex-col sticky top-0">
        <div className="px-6 py-5 border-b border-gray-700">
          <h1 className="text-lg font-bold tracking-tight text-white">🏢 SocietyApp</h1>
          <p className="text-xs text-gray-400 mt-0.5">Committee Dashboard</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white w-full transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-gray-900 text-white shadow-md">
        <h1 className="text-lg font-bold">🏢 SocietyApp</h1>
        <button onClick={handleLogout} className="text-gray-400 hover:text-white p-1" aria-label="Logout">
          <ArrowRightOnRectangleIcon className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-medium transition-colors ${
                active ? "text-indigo-600" : "text-gray-500"
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
