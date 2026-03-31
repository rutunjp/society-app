"use client"
import { useEffect, useState } from "react"
import Nav from "@/components/Nav"
import Modal from "@/components/Modal"
import ConfirmDialog from "@/components/ConfirmDialog"
import PageHeader from "@/components/PageHeader"
import LoadingSpinner from "@/components/LoadingSpinner"
import { TrashIcon, PencilSquareIcon } from "@heroicons/react/24/outline"
import { Expense, Event } from "@/types"
import { toast } from "react-hot-toast"

const EXPENSE_CATEGORIES = [
  "Food & Catering",
  "Decoration",
  "Entertainment/DJ",
  "Labor/Vendor",
  "Logistics/Rentals",
  "Utilities",
  "Other"
]

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEventId, setFilterEventId] = useState("")
  const [filterCategory, setFilterCategory] = useState("All")
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form state
  // use a generic object for form to handle string inputs before conversion
  const [form, setForm] = useState({ 
    event_id: "", 
    title: "", 
    amount: "", 
    notes: "", 
    category: EXPENSE_CATEGORIES[0] 
  })
  
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

  function openAddModal() {
    setForm({ 
      event_id: "", 
      title: "", 
      amount: "", 
      notes: "", 
      category: EXPENSE_CATEGORIES[0] 
    })
    setEditMode(false)
    setEditingId(null)
    setError("")
    setModalOpen(true)
  }

  function openEditModal(expense: Expense) {
    setForm({
      event_id: expense.event_id,
      title: expense.title,
      amount: String(expense.amount),
      notes: expense.notes || "",
      category: expense.category || EXPENSE_CATEGORIES[0]
    })
    setEditMode(true)
    setEditingId(expense.id)
    setError("")
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    
    try {
      const payload = {
        id: editMode ? editingId : undefined,
        ...form,
        amount: Number(form.amount)
      }

      const method = editMode ? "PATCH" : "POST"

      const res = await fetch("/api/expenses", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        setModalOpen(false)
        fetchData()
        toast.success(editMode ? "Expense updated!" : "Expense added!")
      } else {
        setError(data.error || "Failed to save expense")
        toast.error(data.error || "Failed to save expense")
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

  const filtered = expenses.filter(ex => {
    if (filterEventId && ex.event_id !== filterEventId) return false
    if (filterCategory !== "All" && ex.category !== filterCategory) return false
    return true
  })

  const totalFiltered = filtered.reduce((sum, ex) => sum + ex.amount, 0)

  // Determine badge color based on category
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

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Nav />
      <main className="flex-1 p-4 md:p-8 overflow-hidden items-stretch">
        <PageHeader
          title="Expenses"
          subtitle="Track spending across events"
          action={
            <button
              onClick={openAddModal}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              + Add Expense
            </button>
          }
        />

        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
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
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="All">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
               <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {(filterEventId || filterCategory !== "All") && (
            <span className="text-sm text-gray-500 ml-auto">
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
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Category</th>
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
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(ex.category)}`}>
                        {ex.category || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{ex.title}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">
                      ₹{ex.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{ex.notes || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(ex)} 
                          className="text-gray-400 hover:text-indigo-600 transition" 
                          aria-label="Edit"
                        >
                          <PencilSquareIcon className="w-5 h-5 inline-block" />
                        </button>
                        <button 
                          onClick={() => confirmDelete(ex.id)} 
                          className="text-gray-400 hover:text-red-600 transition" 
                          aria-label="Delete"
                        >
                          <TrashIcon className="w-5 h-5 inline-block" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        <Modal title={editMode ? "Edit Expense" : "Add Expense"} open={modalOpen} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
              <select
                value={form.event_id}
                onChange={(e) => setForm({ ...form, event_id: e.target.value })}
                required
                disabled={editMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              >
                <option value="">Select event...</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                placeholder="Dinner plates, Generator hire..."
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
                {submitting ? "Saving..." : editMode ? "Update Expense" : "Add Expense"}
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
