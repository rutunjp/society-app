"use client"
import { useEffect, useState } from "react"
import Nav from "@/components/Nav"
import { Member, Payment, Event, Expense } from "@/types"

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color: string
}

function StatCard({ label, value, sub, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    Promise.all([
      fetch("/api/members").then((r) => r.json()),
      fetch("/api/payments").then((r) => r.json()),
      fetch("/api/events").then((r) => r.json()),
      fetch("/api/expenses").then((r) => r.json()),
    ]).then(([m, p, e, ex]) => {
      if (m.success) setMembers(m.data)
      if (p.success) setPayments(p.data)
      if (e.success) setEvents(e.data)
      if (ex.success) setExpenses(ex.data)
    })
  }, [])

  const totalCollected = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0)

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Nav />
      <main className="flex-1 p-4 md:p-8 overflow-hidden">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Society overview at a glance</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Members" value={members.length} sub="registered flats" color="text-indigo-600" />
          <StatCard
            label="Amount Collected"
            value={`₹${totalCollected.toLocaleString("en-IN")}`}
            sub="paid payments"
            color="text-green-600"
          />
          <StatCard label="Events" value={events.length} sub="festivals & drives" color="text-orange-600" />
          <StatCard
            label="Total Expenses"
            value={`₹${totalExpenses.toLocaleString("en-IN")}`}
            sub="across all events"
            color="text-red-600"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Payments</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-gray-400">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 font-medium">Member ID</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.slice(-5).reverse().map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 text-gray-600">{p.member_id}</td>
                      <td className="py-2 capitalize text-gray-600">{p.type}</td>
                      <td className="py-2 text-gray-900 font-medium">₹{p.amount.toLocaleString("en-IN")}</td>
                      <td className="py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2 text-gray-500">{p.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
