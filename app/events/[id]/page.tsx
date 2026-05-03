"use client"
import { useEffect, useState, useMemo, useCallback } from "react"
import { useSociety } from "@/components/SocietyProvider"
import { useParams, useRouter } from "next/navigation"
import Nav from "@/components/Nav"
import PageHeader from "@/components/PageHeader"
import LoadingSpinner from "@/components/LoadingSpinner"
import { ArrowLeftIcon, BanknotesIcon, ArrowDownRightIcon, ArrowUpRightIcon, ChartPieIcon } from "@heroicons/react/24/outline"
import { Event, Payment, Expense, Member } from "@/types"
import StatusBadge from "@/components/StatusBadge"

export default function EventDashboard() {
  const { activeSociety } = useSociety()

  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true)
      const [evRes, payRes, expRes, memRes] = await Promise.all([
        fetch(`/api/events?society_id=${activeSociety?.id}`).then((r) => r.json()),
        fetch(`/api/payments?society_id=${activeSociety?.id}`).then((r) => r.json()),
        fetch(`/api/expenses?society_id=${activeSociety?.id}`).then((r) => r.json()),
        fetch(`/api/members?society_id=${activeSociety?.id}`).then((r) => r.json()),
      ])

      if (evRes.success) {
        const found = evRes.data.find((e: Event) => e.id === eventId)
        setEvent(found || null)
      }

      if (payRes.success) {
        setPayments(payRes.data.filter((p: Payment) => p.event_id === eventId))
      }

      if (expRes.success) {
        setExpenses(expRes.data.filter((e: Expense) => e.event_id === eventId))
      }

      if (memRes.success) {
        setMembers(memRes.data)
      }

      setLoading(false)
    }

    if (eventId) {
      fetchDashboardData()
    }
  }, [eventId])

  // Analytics Computation
  const stats = useMemo(() => {
    if (!event) return { collected: 0, spent: 0, balance: 0, progress: 0 }

    const collected = payments
      .filter((p) => p.status?.toLowerCase() === "paid")
      .reduce((sum, p) => sum + p.amount, 0)
      
    const spent = expenses.reduce((sum, e) => sum + e.amount, 0)
    const balance = collected - spent
    const progress = event.expected_amount > 0 ? Math.min(100, (collected / event.expected_amount) * 100) : 0

    return { collected, spent, balance, progress }
  }, [event, payments, expenses])

  // Expense Categories Aggregation
  const expenseByCategory = useMemo(() => {
    const acc: Record<string, number> = {}
    expenses.forEach((ex) => {
      const cat = ex.category || "Uncategorized"
      acc[cat] = (acc[cat] || 0) + ex.amount
    })
    return Object.entries(acc).sort((a, b) => b[1] - a[1]) // highest first
  }, [expenses])

  function getMemberName(memberId: string) {
    const m = members.find((mem) => mem.id === memberId)
    return m ? `${m.flat_no} – ${m.name}` : memberId
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Food & Catering": return "bg-orange-100 text-orange-800"
      case "Decoration": return "bg-pink-100 text-pink-800"
      case "Entertainment/DJ": return "bg-purple-100 text-purple-800"
      case "Labor/Vendor": return "bg-blue-100 text-blue-800"
      case "Logistics/Rentals": return "bg-cyan-100 text-cyan-800"
      case "Utilities": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
        <Nav />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </main>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
        <Nav />
        <main className="flex-1 p-8 text-center text-gray-500">Event not found.</main>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Nav />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push("/events")}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back to Events
          </button>

          <PageHeader
            title={`${event.name} Dashboard`}
            subtitle={`Scheduled for ${event.date}`}
          />

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                  <BanknotesIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-gray-500">Expected</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">₹{event.expected_amount.toLocaleString("en-IN")}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-50 p-2 rounded-lg text-green-600">
                  <ArrowDownRightIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-gray-500">Collected</h3>
              </div>
              <p className="text-2xl font-bold text-green-600">₹{stats.collected.toLocaleString("en-IN")}</p>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
                <div
                  className="bg-green-500 rounded-full h-1.5 transition-all duration-500"
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-red-50 p-2 rounded-lg text-red-600">
                  <ArrowUpRightIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-gray-500">Spent</h3>
              </div>
              <p className="text-2xl font-bold text-red-600">₹{stats.spent.toLocaleString("en-IN")}</p>
            </div>

            <div className={`bg-white rounded-xl border ${stats.balance >= 0 ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"} p-5 shadow-sm`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`${stats.balance >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} p-2 rounded-lg`}>
                  <ChartPieIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-gray-700">Net Balance</h3>
              </div>
              <p className={`text-2xl font-bold ${stats.balance >= 0 ? "text-green-700" : "text-red-700"}`}>
                {stats.balance >= 0 ? "+" : "-"}₹{Math.abs(stats.balance).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Collections */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Collections Tracker</h3>
                  <button onClick={() => router.push("/payments")} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                    Manage Payments &rarr;
                  </button>
                </div>
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="text-left text-gray-500">
                        <th className="px-5 py-3 font-medium">Member</th>
                        <th className="px-5 py-3 font-medium text-right">Amount</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payments.length === 0 ? (
                        <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">No collections for this event</td></tr>
                      ) : (
                        payments.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50/50">
                            <td className="px-5 py-3 font-medium text-gray-900">{getMemberName(p.member_id)}</td>
                            <td className="px-5 py-3 text-right font-medium text-green-600">
                              ₹{p.amount.toLocaleString("en-IN")}
                            </td>
                            <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                            <td className="px-5 py-3 text-gray-500">{p.date}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Col: Expenses Breakdown */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Expense Breakdown</h3>
                  <button onClick={() => router.push("/expenses")} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                    Add &rarr;
                  </button>
                </div>
                
                {expenseByCategory.length === 0 ? (
                  <div className="px-5 py-8 text-center text-gray-400 text-sm">No expenses recorded</div>
                ) : (
                  <div className="p-5 space-y-4">
                    {expenseByCategory.map(([category, amount]) => {
                      const percentage = stats.spent > 0 ? (amount / stats.spent) * 100 : 0
                      return (
                        <div key={category}>
                          <div className="flex justify-between items-end mb-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
                              {category}
                            </span>
                            <span className="text-sm font-semibold text-red-600">₹{amount.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="bg-red-400 rounded-full h-1.5" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                {expenses.length > 0 && (
                  <div className="border-t border-gray-100 pt-3 pb-4 px-5 bg-gray-50/30">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">Recent Items</p>
                    <ul className="space-y-3">
                      {expenses.slice(-4).reverse().map(ex => (
                        <li key={ex.id} className="flex justify-between items-start text-sm">
                          <div>
                            <p className="font-medium text-gray-900">{ex.title}</p>
                            <p className="text-xs text-gray-500">{ex.category}</p>
                          </div>
                          <span className="text-gray-900">₹{ex.amount.toLocaleString("en-IN")}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
