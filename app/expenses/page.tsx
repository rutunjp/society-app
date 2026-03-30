"use client"
import { useEffect, useState } from "react"
import Nav from "@/components/Nav"
import Modal from "@/components/Modal"
import ConfirmDialog from "@/components/ConfirmDialog"
import PageHeader from "@/components/PageHeader"
import LoadingSpinner from "@/components/LoadingSpinner"
import { TrashIcon } from "@heroicons/react/24/outline"
import { Expense, Event } from "@/types"
import { toast } from "react-hot-toast"

const EMPTY_FORM = { event_id: "", title: "", amount: "", notes: "" }

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEventId, setFilterEventId] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchData() {
    setLoading(true)
    const [exRes, evRes] = await Promise.all([
      fetch("/api/expenses").then((r) => r.json()),
      fetch("/api/events").then((r) => r.json()),
    ])
    if (exRes.success) setExpenses(exRes.data)
    if (evRes.success) setEvents(evRes.data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  function openModal() {
    setForm({ ...EMPTY_FORM })
    setError("")
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      })
      const data = await res.json()
      if (data.success) {
        setModalOpen(false)
        fetchData()
        toast.success("Expense added successfully")
      } else {
        setError(data.error || "Failed to add expense")
        toast.error(data.error || "Failed to add expense")
      }
    } catch {
      setError("Network error")
      toast.error("Network error")
    } finally {
      setSubmitting(false)
    }
  }

  function confirmDelete(id: string) {
    setDeleteId(id)
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/expenses?id=${deleteId}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        fetchData()
        toast.success("Expense deleted permanently")
      } else {
        toast.error(data.error || "Failed to delete")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  function getEventName(id: string) {
    return events.find((e) => e.id === id)?.name || id
  }

  const filtered = filterEventId
    ? expenses.filter((ex) => ex.event_id === filterEventId)
    : expenses

  const totalFiltered = filtered.reduce((sum, ex) => sum + ex.amount, 0)

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Nav />
      <main className="flex-1 p-4 md:p-8 overflow-hidden items-stretch">
        <PageHeader
          title="Expenses"
          subtitle="Track spending across events"
          action={
            <button
              onClick={openModal}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              + Add Expense
            </button>
          }
        />

        <div className="mb-4 flex items-center gap-3">
          <select
            value={filterEventId}
            onChange={(e) => setFilterEventId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Events</option>
            {events.map((ev) => (
               <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
          {filterEventId && (
            <span className="text-sm text-gray-500">
              Total: <strong className="text-gray-900">₹{totalFiltered.toLocaleString("en-IN")}</strong>
            </span>
          )}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : expenses.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No expenses recorded</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((ex) => (
                  <tr key={ex.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-indigo-700 font-medium">{getEventName(ex.event_id)}</td>
                    <td className="px-4 py-3 text-gray-900">{ex.title}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">
                      ₹{ex.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{ex.notes || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => confirmDelete(ex.id)} className="text-red-500 hover:text-red-700 transition" aria-label="Delete">
                        <TrashIcon className="w-5 h-5 inline-block" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        <Modal title="Add Expense" open={modalOpen} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
              <select
                value={form.event_id}
                onChange={(e) => setForm({ ...form, event_id: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select event...</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                placeholder="Decoration, DJ, Catering..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                placeholder="5000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                placeholder="Additional details..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Add Expense"}
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={!!deleteId}
          title="Delete Expense"
          message="Are you sure you want to delete this expense record? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleting}
        />
      </main>
    </div>
  )
}
