"use client"
import { useEffect, useState, useMemo, useCallback } from "react"
import { useSociety } from "@/components/SocietyProvider"
import Nav from "@/components/Nav"
import Modal from "@/components/Modal"
import ConfirmDialog from "@/components/ConfirmDialog"
import PageHeader from "@/components/PageHeader"
import LoadingSpinner from "@/components/LoadingSpinner"
import ReceiptPreview from "@/components/ReceiptPreview"
import BulkReceiptShare from "@/components/BulkReceiptShare"
import { TrashIcon, ShareIcon } from "@heroicons/react/24/outline"
import StatusBadge from "@/components/StatusBadge"
import { Payment, Member, Event } from "@/types"
import { toast } from "react-hot-toast"
import {
  getCurrentFinancialYear,
  getFinancialYears,
  PAYMENT_MODES,
} from "@/lib/society-config"

const EMPTY_FORM = {
  member_id: "",
  type: "maintenance",
  event_id: "",
  amount: "",
  status: "paid",
  date: new Date().toISOString().split("T")[0],
  period: getCurrentFinancialYear(),
  payment_mode: "upi",
}

export default function PaymentsPage() {
  const { activeSociety } = useSociety()

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

  // Filters
  const [filterType, setFilterType] = useState<"all" | "maintenance" | "event">("all")
  const [filterPeriod, setFilterPeriod] = useState<string>("all")
  const financialYears = useMemo(() => getFinancialYears(), [])

  // Receipt preview
  const [receiptPayment, setReceiptPayment] = useState<{
    payment: Payment
    member: Member
  } | null>(null)

  // Bulk Selection
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<string>>(new Set())
  const [bulkShareOpen, setBulkShareOpen] = useState(false)

  const fetchData = useCallback(async () => {
    if (!activeSociety) return
    setLoading(true)
    const [pRes, mRes, eRes] = await Promise.all([
      fetch(`/api/payments?society_id=${activeSociety?.id}`).then((r) => r.json()),
      fetch(`/api/members?society_id=${activeSociety?.id}`).then((r) => r.json()),
      fetch(`/api/events?society_id=${activeSociety?.id}`).then((r) => r.json()),
    ])
    if (pRes.success) setPayments(pRes.data)
    if (mRes.success) setMembers(mRes.data)
    if (eRes.success) setEvents(eRes.data)
    setLoading(false)
  }, [activeSociety])

  useEffect(() => {
    document.title = "Payments | SocietyApp"
    fetchData()
  }, [])

  // Filtered payments
  const filteredPayments = useMemo(() => {
    let result = [...payments]
    if (filterType !== "all") {
      result = result.filter((p) => p.type === filterType)
    }
    if (filterPeriod !== "all") {
      result = result.filter((p) => p.period === filterPeriod)
    }
    return result.reverse()
  }, [payments, filterType, filterPeriod])

  // Reset selection when filters change or data refetches
  useEffect(() => {
    setSelectedPaymentIds(new Set())
  }, [filteredPayments])

  function toggleSelection(id: string) {
    setSelectedPaymentIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedPaymentIds.size > 0 && selectedPaymentIds.size === filteredPayments.length) {
      setSelectedPaymentIds(new Set())
    } else {
      setSelectedPaymentIds(new Set(filteredPayments.map(p => p.id)))
    }
  }

  const bulkItems = useMemo(() => {
    return Array.from(selectedPaymentIds)
      .map(id => {
        const p = payments.find(p => p.id === id)
        if (!p) return null
        const member = members.find(m => m.id === p.member_id)
        if (!member) return null
        return { 
          payment: p, 
          member, 
          eventName: p.type === 'event' ? getEventName(p.event_id || '') : undefined
        }
      })
      .filter(Boolean) as { payment: Payment; member: Member; eventName?: string }[]
  }, [selectedPaymentIds, payments, members, events])

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
          period: form.type === "maintenance" ? form.period : "",
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

  function handleShareReceipt(p: Payment) {
    const member = members.find((m) => m.id === p.member_id)
    if (!member) {
      toast.error("Member details not found")
      return
    }
    setReceiptPayment({ payment: p, member })
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Nav />
      <main className="flex-1 p-4 md:p-8 overflow-hidden items-stretch">
        <PageHeader
          title="Payments"
          subtitle={`${filteredPayments.length} payment records`}
          action={
            <button
              onClick={openModal}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              + Add Payment
            </button>
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as "all" | "maintenance" | "event")
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="maintenance">Maintenance</option>
            <option value="event">Event</option>
          </select>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Periods</option>
            {financialYears.map((fy) => (
              <option key={fy} value={fy}>
                FY {fy}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Actions Bar */}
        {selectedPaymentIds.size > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-4 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-bold text-indigo-800">
              {selectedPaymentIds.size} payment{selectedPaymentIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setBulkShareOpen(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
                Bulk WhatsApp Share
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No payments found</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-gray-500 uppercase text-xs tracking-wider">
                  <th className="px-4 py-3 flex items-center h-[45px]">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      checked={selectedPaymentIds.size > 0 && selectedPaymentIds.size === filteredPayments.length}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold">Member</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Event / Period</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Mode</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className={`transition-colors ${selectedPaymentIds.has(p.id) ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        checked={selectedPaymentIds.has(p.id)}
                        onChange={() => toggleSelection(p.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{getMemberName(p.member_id)}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{p.type}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.type === "event"
                        ? getEventName(p.event_id || '')
                        : p.period
                        ? `FY ${p.period}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3">{p.date}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">
                      {p.payment_mode || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {p.status?.toLowerCase() === "paid" && (
                          <button
                            onClick={() => handleShareReceipt(p)}
                            title="View & Share Receipt"
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

            {form.type === "maintenance" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period (Financial Year)</label>
                <select
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {financialYears.map((fy) => (
                    <option key={fy} value={fy}>
                      FY {fy}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <select
                value={form.payment_mode}
                onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {PAYMENT_MODES.map((pm) => (
                  <option key={pm.value} value={pm.value}>
                    {pm.label}
                  </option>
                ))}
              </select>
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

        {/* Receipt Preview */}
        {receiptPayment && (
          <ReceiptPreview
            open={true}
            onClose={() => setReceiptPayment(null)}
            phoneNumber={receiptPayment.member.phone}
            receiptData={{
              receiptNo: receiptPayment.payment.id,
              date: receiptPayment.payment.date,
              memberName: receiptPayment.member.name,
              flatNo: receiptPayment.member.flat_no,
              amount: receiptPayment.payment.amount,
              paymentType: receiptPayment.payment.type,
              eventName:
                receiptPayment.payment.type === "event"
                  ? getEventName(receiptPayment.payment.event_id || '')
                  : undefined,
              period: receiptPayment.payment.period || undefined,
              paymentMode: receiptPayment.payment.payment_mode || undefined,
              receivedBy: "Committee",
            }}
          />
        )}

        <BulkReceiptShare
          open={bulkShareOpen}
          onClose={() => setBulkShareOpen(false)}
          items={bulkItems}
          onComplete={() => {
            setSelectedPaymentIds(new Set())
          }}
        />
      </main>
    </div>
  )
}
