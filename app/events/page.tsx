"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import Nav from "@/components/Nav"
import Modal from "@/components/Modal"
import ConfirmDialog from "@/components/ConfirmDialog"
import PageHeader from "@/components/PageHeader"
import LoadingSpinner from "@/components/LoadingSpinner"
import { TrashIcon, ArrowRightIcon } from "@heroicons/react/24/outline"
import { Event, Payment, Expense } from "@/types"
import { toast } from "react-hot-toast"

const EMPTY_FORM = { name: "", expected_amount: "", date: "" }

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchData() {
    setLoading(true)
    const [evRes, payRes, expRes] = await Promise.all([
      fetch("/api/events").then(r => r.json()),
      fetch("/api/payments").then(r => r.json()),
      fetch("/api/expenses").then(r => r.json())
    ])
    
    if (evRes.success) setEvents(evRes.data)
    if (payRes.success) setPayments(payRes.data)
    if (expRes.success) setExpenses(expRes.data)
      
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
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expected_amount: Number(form.expected_amount),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setModalOpen(false)
        fetchData()
        toast.success("Event created successfully!")
      } else {
        setError(data.error || "Failed to create event")
        toast.error(data.error || "Failed to create event")
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
      const res = await fetch(`/api/events?id=${deleteId}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        fetchData()
        toast.success("Event deleted from system.")
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

  // Calculate stats for a given event
  function getEventStats(eventId: string) {
    const collected = payments
      .filter(p => p.event_id === eventId && p.status?.toLowerCase() === "paid")
      .reduce((sum, p) => sum + p.amount, 0)
      
    const spent = expenses
      .filter(e => e.event_id === eventId)
      .reduce((sum, e) => sum + e.amount, 0)
      
    return {
      collected,
      spent,
      balance: collected - spent
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Nav />
      <main className="flex-1 p-4 md:p-8 overflow-hidden">
        <PageHeader
          title="Events"
          subtitle="Manage festivals and fund collections"
          action={
            <button
              onClick={openModal}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              + New Event
            </button>
          }
        />

        {loading ? (
          <LoadingSpinner />
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No events yet</p>
            <p className="text-sm mt-1">Create your first event to start collecting funds</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {events.map((ev) => {
              const stats = getEventStats(ev.id)
              const balanceColor = stats.balance >= 0 ? "text-green-600" : "text-red-600"
              
              return (
                <div key={ev.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full">
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">{ev.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{ev.date}</p>
                      </div>
                      <button 
                        onClick={() => confirmDelete(ev.id)} 
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition" 
                        aria-label="Delete Event"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Expected</p>
                        <p className="font-medium text-gray-900">₹{ev.expected_amount.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Net Balance</p>
                        <p className={`font-semibold ${balanceColor}`}>
                          {stats.balance >= 0 ? "+" : "-"}₹{Math.abs(stats.balance).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-100 p-4 bg-gray-50 flex items-center justify-between">
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">In:</span> <span className="font-medium text-green-600">₹{stats.collected.toLocaleString("en-IN")}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Out:</span> <span className="font-medium text-red-600">₹{stats.spent.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                    
                    <Link 
                      href={`/events/${ev.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Dashboard
                      <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <Modal title="New Event" open={modalOpen} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
              <input
                type="text"
                placeholder="Diwali Fund, Navratri Collection..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Amount (₹)</label>
              <input
                type="number"
                placeholder="1000"
                value={form.expected_amount}
                onChange={(e) => setForm({ ...form, expected_amount: e.target.value })}
                required
                min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                {submitting ? "Creating..." : "Create Event"}
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={!!deleteId}
          title="Delete Event"
          message="Are you sure you want to delete this event? This action will permanently remove it from the database."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleting}
        />
      </main>
    </div>
  )
}
