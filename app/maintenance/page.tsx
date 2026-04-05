"use client"
import { useEffect, useState, useMemo } from "react"
import Nav from "@/components/Nav"
import PageHeader from "@/components/PageHeader"
import LoadingSpinner from "@/components/LoadingSpinner"
import StatusBadge from "@/components/StatusBadge"
import ReceiptPreview from "@/components/ReceiptPreview"
import Modal from "@/components/Modal"
import { Payment, Member } from "@/types"
import { toast } from "react-hot-toast"
import {
  SOCIETY_CONFIG,
  getCurrentFinancialYear,
  getFinancialYears,
  PAYMENT_MODES,
  PaymentMode,
} from "@/lib/society-config"
import {
  CheckCircleIcon,
  ShareIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline"

interface MemberWithPayment {
  member: Member
  payment: Payment | null
}

export default function MaintenancePage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [config, setConfig] = useState(SOCIETY_CONFIG)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentFinancialYear())
  const financialYears = useMemo(() => getFinancialYears(), [])

  // Individual Mark as Paid modal
  const [markPaidMember, setMarkPaidMember] = useState<MemberWithPayment | null>(null)
  const [markPaidForm, setMarkPaidForm] = useState({
    date: new Date().toISOString().split("T")[0],
    payment_mode: "upi" as PaymentMode,
  })
  const [submitting, setSubmitting] = useState(false)

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkMarkPaidOpen, setBulkMarkPaidOpen] = useState(false)
  const [bulkForm, setBulkForm] = useState({
    date: new Date().toISOString().split("T")[0],
    payment_mode: "upi" as PaymentMode,
  })

  // Receipt preview
  const [receiptPayment, setReceiptPayment] = useState<{
    payment: Payment
    member: Member
  } | null>(null)

  // Generating pending
  const [generatingPending, setGeneratingPending] = useState(false)

  async function fetchData() {
    setLoading(true)
    const [pRes, mRes, cRes] = await Promise.all([
      fetch("/api/payments").then((r) => r.json()),
      fetch("/api/members").then((r) => r.json()),
      fetch("/api/config").then((r) => r.json()).catch(() => null),
    ])
    if (pRes.success) setPayments(pRes.data)
    if (mRes.success) setMembers(mRes.data)
    if (cRes && cRes.maintenanceAmount) setConfig(cRes)
    setLoading(false)
  }

  useEffect(() => {
    document.title = "Maintenance | SocietyApp"
    fetchData()
  }, [])

  // Build merged member + payment list for selected period
  const memberPayments: MemberWithPayment[] = useMemo(() => {
    const maintenanceForPeriod = payments.filter(
      (p) => p.type === "maintenance" && p.period === selectedPeriod
    )
    return members.map((m) => {
      const payment = maintenanceForPeriod.find((p) => p.member_id === m.id)
      return { member: m, payment: payment || null }
    })
  }, [members, payments, selectedPeriod])

  const stats = useMemo(() => {
    const total = memberPayments.length
    const paid = memberPayments.filter((mp) => mp.payment?.status === "paid").length
    const pending = memberPayments.filter(
      (mp) => !mp.payment || mp.payment.status === "pending"
    ).length
    const collected = memberPayments
      .filter((mp) => mp.payment?.status === "paid")
      .reduce((sum, mp) => sum + (mp.payment?.amount || 0), 0)
    const expected = total * config.maintenanceAmount
    const pct = total > 0 ? Math.round((paid / total) * 100) : 0
    return { total, paid, pending, collected, expected, pct }
  }, [memberPayments, config.maintenanceAmount])

  // Mark as paid — create new payment OR update existing pending
  async function handleMarkPaid() {
    if (!markPaidMember) return
    setSubmitting(true)

    const { member, payment } = markPaidMember

    try {
      if (payment && payment.status === "pending") {
        // PATCH existing pending payment
        const res = await fetch("/api/payments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: payment.id,
            status: "paid",
            date: markPaidForm.date,
            payment_mode: markPaidForm.payment_mode,
          }),
        })
        const data = await res.json()
        if (data.success) {
          toast.success(`${member.name} marked as paid!`)
          setMarkPaidMember(null)
          fetchData()
        } else {
          toast.error(data.error || "Failed to update")
        }
      } else {
        // POST new payment
        const res = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            member_id: member.id,
            type: "maintenance",
            event_id: "",
            amount: config.maintenanceAmount,
            status: "paid",
            date: markPaidForm.date,
            period: selectedPeriod,
            payment_mode: markPaidForm.payment_mode,
          }),
        })
        const data = await res.json()
        if (data.success) {
          toast.success(`${member.name} marked as paid!`)
          setMarkPaidMember(null)
          fetchData()
        } else {
          toast.error(data.error || "Failed to add payment")
        }
      }
    } catch {
      toast.error("Network error")
    } finally {
      setSubmitting(false)
    }
  }

  // Generate pending entries for selected or all members who don't have a payment
  async function handleGeneratePending() {
    // If some are selected, only generate for those. If none selected, generate for all without entry.
    const targets = selectedIds.size > 0 
      ? memberPayments.filter(mp => selectedIds.has(mp.member.id) && !mp.payment)
      : memberPayments.filter(mp => !mp.payment)

    if (targets.length === 0) {
      toast("No eligible members selected (only members without entries can be generated)", { icon: "ℹ️" })
      return
    }

    setGeneratingPending(true)
    try {
      const res = await fetch("/api/payments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payments: targets.map(t => ({
            member_id: t.member.id,
            type: "maintenance",
            event_id: "",
            amount: config.maintenanceAmount,
            status: "pending",
            date: new Date().toISOString().split("T")[0],
            period: selectedPeriod,
            payment_mode: "",
          }))
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Generated ${data.count} pending entries`)
        fetchData()
        setSelectedIds(new Set())
      } else {
        toast.error(data.error || "Bulk generation failed")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setGeneratingPending(false)
    }
  }

  async function handleBulkMarkPaid() {
    if (selectedIds.size === 0) return
    setSubmitting(true)

    // Separate selected members into those with existing pending payments and those without entries
    const withPending = memberPayments.filter(mp => selectedIds.has(mp.member.id) && mp.payment?.status === "pending")
    const withoutEntry = memberPayments.filter(mp => selectedIds.has(mp.member.id) && !mp.payment)

    if (withPending.length === 0 && withoutEntry.length === 0) {
      toast.error("Selected members are either already paid or ineligible")
      setSubmitting(false)
      return
    }

    try {
      const promises = []

      // 1. Batch PATCH existing pending ones
      if (withPending.length > 0) {
        promises.push(fetch("/api/payments/bulk", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            updates: withPending.map(mp => ({
              id: mp.payment!.id,
              status: "paid",
              date: bulkForm.date,
              payment_mode: bulkForm.payment_mode,
            }))
          })
        }))
      }

      // 2. Batch POST new payments for those without entry
      if (withoutEntry.length > 0) {
        promises.push(fetch("/api/payments/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payments: withoutEntry.map(mp => ({
              member_id: mp.member.id,
              type: "maintenance",
              event_id: "",
              amount: config.maintenanceAmount,
              status: "paid",
              date: bulkForm.date,
              period: selectedPeriod,
              payment_mode: bulkForm.payment_mode,
            }))
          })
        }))
      }

      await Promise.all(promises)
      toast.success(`Successfully updated ${selectedIds.size} payments`)
      setBulkMarkPaidOpen(false)
      fetchData()
      setSelectedIds(new Set())
    } catch {
      toast.error("Failed to complete bulk update")
    } finally {
      setSubmitting(false)
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  function toggleSelectAll() {
    if (selectedIds.size === memberPayments.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(memberPayments.map(mp => mp.member.id)))
    }
  }

  function openMarkPaid(mp: MemberWithPayment) {
    setMarkPaidMember(mp)
    setMarkPaidForm({
      date: new Date().toISOString().split("T")[0],
      payment_mode: "upi",
    })
  }

  function openReceipt(mp: MemberWithPayment) {
    if (!mp.payment || mp.payment.status !== "paid") return
    setReceiptPayment({ payment: mp.payment, member: mp.member })
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Nav />
      <main className="flex-1 p-4 md:p-8 overflow-hidden">
        <PageHeader
          title="Maintenance Collection"
          subtitle={`FY ${selectedPeriod} · ₹${config.maintenanceAmount.toLocaleString("en-IN")} per flat`}
          action={
            <div className="flex gap-2 flex-wrap">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {financialYears.map((fy) => (
                  <option key={fy} value={fy}>
                    FY {fy}
                  </option>
                ))}
              </select>
              <button
                onClick={handleGeneratePending}
                disabled={generatingPending || loading}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {generatingPending ? "Generating..." : "Generate Pending"}
              </button>
            </div>
          }
        />

        {/* Stats Bar */}
        {!loading && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total Flats</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl border border-green-200 p-4">
              <p className="text-xs text-green-600 uppercase tracking-wider">Paid</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.paid}</p>
            </div>
            <div className="bg-white rounded-xl border border-yellow-200 p-4">
              <p className="text-xs text-yellow-600 uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-xl border border-indigo-200 p-4">
              <p className="text-xs text-indigo-600 uppercase tracking-wider">Collected</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                ₹{stats.collected.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-2 lg:col-span-1">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Progress</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pct}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-green-500 rounded-full h-2 transition-all duration-500"
                  style={{ width: `${stats.pct}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Member Collection Grid */}
        {loading ? (
          <LoadingSpinner />
        ) : members.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No members found</p>
            <p className="text-sm mt-1">
              Add members first to start collecting maintenance
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500">
                    <th className="px-4 py-3 font-medium w-10">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.size === memberPayments.length && memberPayments.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">Flat</th>
                    <th className="px-4 py-3 font-medium">Member</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Mode</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {memberPayments.map((mp) => {
                    const isPaid = mp.payment?.status === "paid"
                    const isPending = mp.payment?.status === "pending"
                    const noEntry = !mp.payment

                    return (
                      <tr
                        key={mp.member.id}
                        className={`transition-colors ${
                          selectedIds.has(mp.member.id)
                            ? "bg-indigo-50"
                            : isPaid
                            ? "bg-green-50/40 hover:bg-green-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.has(mp.member.id)}
                            onChange={() => toggleSelect(mp.member.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3 font-semibold text-indigo-700">
                          {mp.member.flat_no}
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {mp.member.name}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          ₹
                          {(
                            mp.payment?.amount || config.maintenanceAmount
                          ).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3">
                          {isPaid ? (
                            <StatusBadge status="paid" />
                          ) : isPending ? (
                            <StatusBadge status="pending" />
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              No entry
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {mp.payment?.date || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 capitalize">
                          {mp.payment?.payment_mode || "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPaid ? (
                              <button
                                onClick={() => openReceipt(mp)}
                                title="View & Share Receipt"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                              >
                                <ShareIcon className="w-3.5 h-3.5" />
                                Receipt
                              </button>
                            ) : (
                              <button
                                onClick={() => openMarkPaid(mp)}
                                title="Mark as Paid"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
                              >
                                {noEntry ? (
                                  <>
                                    <PlusCircleIcon className="w-3.5 h-3.5" />
                                    Collect
                                  </>
                                ) : (
                                  <>
                                    <CheckCircleIcon className="w-3.5 h-3.5" />
                                    Mark Paid
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mark as Paid Modal */}
        <Modal
          title="Mark as Paid"
          open={!!markPaidMember}
          onClose={() => setMarkPaidMember(null)}
        >
          {markPaidMember && (
            <div className="space-y-4">
              <div className="bg-indigo-50 rounded-lg p-4 text-sm">
                <p className="font-medium text-indigo-900">
                  {markPaidMember.member.flat_no} –{" "}
                  {markPaidMember.member.name}
                </p>
                <p className="text-indigo-700 mt-1">
                  Maintenance for FY {selectedPeriod} ·{" "}
                  <strong>
                    ₹
                    {config.maintenanceAmount.toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={markPaidForm.date}
                  onChange={(e) =>
                    setMarkPaidForm({ ...markPaidForm, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={markPaidForm.payment_mode}
                  onChange={(e) =>
                    setMarkPaidForm({
                      ...markPaidForm,
                      payment_mode: e.target.value as PaymentMode,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PAYMENT_MODES.map((pm) => (
                    <option key={pm.value} value={pm.value}>
                      {pm.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setMarkPaidMember(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkPaid}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Saving..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Bulk Mark as Paid Modal */}
        <Modal
          title={`Bulk Mark as Paid (${selectedIds.size} selected)`}
          open={bulkMarkPaidOpen}
          onClose={() => setBulkMarkPaidOpen(false)}
        >
          <div className="space-y-4">
            <div className="bg-indigo-50 rounded-lg p-4 text-sm">
              <p className="font-medium text-indigo-900">
                Updating {selectedIds.size} payments
              </p>
              <p className="text-indigo-700 mt-1">
                Setting all selected as <strong>Paid</strong> for FY {selectedPeriod}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={bulkForm.date}
                onChange={(e) =>
                  setBulkForm({ ...bulkForm, date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Mode
              </label>
              <select
                value={bulkForm.payment_mode}
                onChange={(e) =>
                  setBulkForm({
                    ...bulkForm,
                    payment_mode: e.target.value as PaymentMode,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {PAYMENT_MODES.map((pm) => (
                  <option key={pm.value} value={pm.value}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setBulkMarkPaidOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkMarkPaid}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Updating..." : "Update All Selected"}
              </button>
            </div>
          </div>
        </Modal>

        {/* Bulk Actions Sticky Bar */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] md:w-auto bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex items-center gap-3 pr-6 border-r border-gray-700">
              <span className="bg-indigo-600 text-white w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold">
                {selectedIds.size}
              </span>
              <span className="text-sm font-medium">Selected</span>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setBulkMarkPaidOpen(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <CheckCircleIcon className="w-5 h-5" />
                Mark Paid
              </button>
              
              <button
                onClick={handleGeneratePending}
                disabled={generatingPending}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Generate Pending
              </button>

              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-semibold transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

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
              paymentType: "maintenance",
              period: receiptPayment.payment.period,
              paymentMode: receiptPayment.payment.payment_mode,
              receivedBy: "Committee",
            }}
          />
        )}
      </main>
    </div>
  )
}
