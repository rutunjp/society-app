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
    <div className="relative overflow-hidden bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 p-6 transition-transform hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <div className="absolute top-0 right-0 p-4 opacity-10 blur-2xl rounded-full w-24 h-24 bg-current" style={{ color: 'var(--tw-text-opacity, inherit)' }}></div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`text-4xl font-extrabold mt-2 tracking-tight ${color}`}>{value}</p>
      {sub && <p className="text-xs font-medium text-slate-400 mt-2">{sub}</p>}
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
    <div className="flex flex-col md:flex-row min-h-screen pb-20 md:pb-0 font-sans">
      <Nav />
      <main className="flex-1 p-4 md:p-8 lg:px-12 overflow-hidden max-w-7xl mx-auto w-full">
        <div className="mb-10 mt-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Financial Dashboard</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Society overview at a glance</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard label="Total Members" value={members.length} sub="Registered flats" color="text-indigo-600" />
          <StatCard
            label="Amount Collected"
            value={`₹${totalCollected.toLocaleString("en-IN")}`}
            sub="Paid maintenance & events"
            color="text-emerald-600"
          />
          <StatCard label="Total Events" value={events.length} sub="Festivals & drives" color="text-violet-600" />
          <StatCard
            label="Total Expenses"
            value={`₹${totalExpenses.toLocaleString("en-IN")}`}
            sub="Across all events"
            color="text-rose-600"
          />
        </div>

        <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 tracking-tight">Recent Transactions</h2>
            <div className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">Last 5 payments</div>
          </div>
          {payments.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No transactions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="text-left bg-slate-50/80 text-slate-500 border-b border-slate-100">
                    <th className="px-4 py-3 font-semibold rounded-tl-xl text-xs uppercase tracking-wider">Member ID</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 font-semibold rounded-tr-xl text-xs uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 bg-white/40">
                  {payments.slice(-5).reverse().map((p) => (
                    <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-4 py-3 text-slate-600 font-medium">{p.member_id}</td>
                      <td className="px-4 py-3 capitalize text-slate-500">{p.type}</td>
                      <td className="px-4 py-3 text-slate-900 font-bold">₹{p.amount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          p.status === "paid" ? "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-600/20" : "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-600/20"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{p.date}</td>
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
