"use client"
import { useEffect, useState } from "react"
import Nav from "@/components/Nav"
import Modal from "@/components/Modal"
import ConfirmDialog from "@/components/ConfirmDialog"
import PageHeader from "@/components/PageHeader"
import LoadingSpinner from "@/components/LoadingSpinner"
import { TrashIcon, ShareIcon } from "@heroicons/react/24/outline"
import StatusBadge from "@/components/StatusBadge"
import { Payment, Member, Event } from "@/types"
import { toast } from "react-hot-toast"
import { generateReceiptImage } from "@/lib/pdf-generator"

const EMPTY_FORM = {
  member_id: "",
  type: "maintenance",
  event_id: "",
  amount: "",
  status: "paid",
  date: new Date().toISOString().split("T")[0],
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchData() {
    setLoading(true)
    const [pRes, mRes, eRes] = await Promise.all([
      fetch("/api/payments").then((r) => r.json()),
      fetch("/api/members").then((r) => r.json()),
      fetch("/api/events").then((r) => r.json()),
    ])
    if (pRes.success) setPayments(pRes.data)
    if (mRes.success) setMembers(mRes.data)
    if (eRes.success) setEvents(eRes.data)
    setLoading(false)
  }

  useEffect(() => {
    document.title = "Payments | SocietyApp"
    fetchData()
  }, [])

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
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          event_id: form.type === "event" ? form.event_id : "",
        }),
      })
      const data = await res.json()
      if (data.success) {
        setModalOpen(false)
        fetchData()
        toast.success("Payment added successfully!")
      } else {
        setError(data.error || "Failed to add payment")
        toast.error(data.error || "Failed to add payment")
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
      const res = await fetch(`/api/payments?id=${deleteId}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        fetchData()
        toast.success("Payment deleted successfully")
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

  function getMemberName(id: string) {
    const m = members.find((m) => m.id === id)
    return m ? `${m.flat_no} – ${m.name}` : id
  }

  function getEventName(id: string) {
    const e = events.find((e) => e.id === id)
    return e ? e.name : "—"
  }

  async function handleShareReceipt(p: Payment) {
    const member = members.find((m) => m.id === p.member_id)
    if (!member) {
      toast.error("Member details not found")
      return
    }

    toast.loading("Generating receipt image...", { id: "receipt" })
    try {
      const blob = await generateReceiptImage({
        receiptNo: p.id,
        date: p.date,
        memberName: member.name,
        flatNo: member.flat_no,
        amount: p.amount,
        paymentType: p.type,
        eventName: p.type === "event" ? getEventName(p.event_id) : undefined,
        receivedBy: "Committee",
      })

      // Download the JPEG image
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Receipt_${p.id}.jpg`
      a.click()
      URL.revokeObjectURL(url)

      toast.dismiss("receipt")
      toast.success("Receipt image downloaded. Preparing WhatsApp message…")

      // Build WhatsApp message
      const typeLabel = p.type === "event" ? getEventName(p.event_id) : "Maintenance"
      const text = `Hello ${member.name},\n\nThis is a confirmation that we have received your payment of ₹${p.amount.toLocaleString("en-IN")} towards ${typeLabel} on ${p.date}.\n\n*This is an electronically generated receipt.*\n\nPlease find the receipt image attached to this message.\n\nThank you!\nSocietyApp Committee`

      let phoneNum = member.phone?.replace(/\D/g, "") || ""
      if (phoneNum.length === 10) {
        phoneNum = `91${phoneNum}`
      }
      window.open(`https://wa.me/${phoneNum}?text=${encodeURIComponent(text)}`, "_blank")
    } catch {
      toast.error("Error generating receipt image", { id: "receipt" })
    }
  }


  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Nav />
      <main className="flex-1 p-4 md:p-8 overflow-hidden items-stretch">
        <PageHeader
          title="Payments"
          subtitle={`${payments.length} payment records`}
          action={
            <button
              onClick={openModal}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              + Add Payment
            </button>
          }
        />

        {loading ? (
          <LoadingSpinner />
        ) : payments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No payments recorded yet</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...payments].reverse().map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{getMemberName(p.member_id)}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{p.type}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.type === "event" ? getEventName(p.event_id) : "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3">{p.date}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {p.status === "paid" && (
                          <button
                            onClick={() => handleShareReceipt(p)}
                            title="Share Receipt (WhatsApp)"
                            className="text-green-600 hover:text-green-800 transition"
                            aria-label="Share WhatsApp"
                          >
                            <ShareIcon className="w-5 h-5 inline-block" />
                          </button>
                        )}
                        <button onClick={() => confirmDelete(p.id)} className="text-red-500 hover:text-red-700 transition" aria-label="Delete">
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

        <Modal title="Add Payment" open={modalOpen} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
              <select
                value={form.member_id}
                onChange={(e) => setForm({ ...form, member_id: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select member...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.flat_no} – {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value, event_id: "" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="maintenance">Maintenance</option>
                <option value="event">Event</option>
              </select>
            </div>

            {form.type === "event" && (
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
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                placeholder="1000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
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
                {submitting ? "Saving..." : "Add Payment"}
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={!!deleteId}
          title="Delete Payment"
          message="Are you sure you want to delete this payment record? It will be removed permanently."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleting}
        />
      </main>
    </div>
  )
}
