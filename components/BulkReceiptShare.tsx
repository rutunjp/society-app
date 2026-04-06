"use client"
import { useState } from "react"
import { XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline"
import { generateReceiptImage, ReceiptData } from "@/lib/pdf-generator"
import { Payment, Member } from "@/types"
import { toast } from "react-hot-toast"

interface BulkItem {
  payment: Payment
  member: Member
  eventName?: string
}

interface BulkReceiptShareProps {
  open: boolean
  onClose: () => void
  items: BulkItem[]
  onComplete?: () => void
}

export default function BulkReceiptShare({ open, onClose, items, onComplete }: BulkReceiptShareProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [processing, setProcessing] = useState(false)

  if (!open) return null

  if (items.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 text-center">
          <p className="text-gray-600 font-medium">No valid payment records selected for sharing.</p>
          <button onClick={onClose} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Close</button>
        </div>
      </div>
    )
  }

  const isComplete = currentIndex >= items.length
  const currentItem = items[currentIndex]

  async function handleSendNext() {
    if (!currentItem) return
    setProcessing(true)
    
    try {
      const receiptData: ReceiptData = {
        receiptNo: currentItem.payment.id,
        date: currentItem.payment.date,
        memberName: currentItem.member.name,
        flatNo: currentItem.member.flat_no,
        amount: currentItem.payment.amount,
        paymentType: currentItem.payment.type,
        eventName: currentItem.eventName,
        period: currentItem.payment.period,
        paymentMode: currentItem.payment.payment_mode,
        receivedBy: "Committee"
      }

      const typeLabel = currentItem.payment.type === "event" ? currentItem.eventName || "Event" : "Maintenance"
      const periodStr = currentItem.payment.period ? ` for FY ${currentItem.payment.period}` : ""
      const text = `Hello ${receiptData.memberName},\n\nThis is a confirmation that we have received your payment of ₹${receiptData.amount.toLocaleString("en-IN")} towards ${typeLabel}${periodStr} on ${receiptData.date}.\n\n*This is an electronically generated receipt.*\n\nThank you!\nSociety Committee`

      // 1. Generate image and copy to clipboard
      const blob = await generateReceiptImage(receiptData)
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ])
        toast.success(`Copied image to clipboard!`)
      } catch (err) {
        console.warn("Clipboard write failed, your browser might not support it.", err)
      }

      // 2. Open WA popup
      let phoneNum = currentItem.member.phone?.replace(/\D/g, "") || ""
      if (phoneNum.length === 10) phoneNum = `91${phoneNum}`

      const waUrl = `https://wa.me/${phoneNum}?text=${encodeURIComponent(text)}`
      window.open(waUrl, "_blank", "noopener,noreferrer")

      setCurrentIndex(prev => prev + 1)
      toast.success(`Prepared WhatsApp for ${currentItem.member.name}`)
    } catch (e) {
      toast.error("Failed to generate receipt. You can skip to the next one.")
      console.error(e)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Bulk WhatsApp Send</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex flex-col items-center justify-center text-center">
          {isComplete ? (
            <div className="py-8">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-lg font-bold text-gray-900">All Done!</h3>
              <p className="text-sm text-gray-500 mb-6 font-medium">Successfully processed {items.length} payments.</p>
              <button 
                onClick={() => { onClose(); onComplete?.(); }} 
                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="w-full">
              <div className="bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full py-1.5 px-4 inline-block mb-4 ring-1 ring-inset ring-indigo-600/20">
                Sending {currentIndex + 1} of {items.length}
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight mb-1">
                {currentItem.member.name} <span className="text-slate-500 font-medium">({currentItem.member.flat_no})</span>
              </h3>
              <p className="text-sm text-emerald-600 font-bold mb-6">
                ₹{currentItem.payment.amount.toLocaleString("en-IN")} <span className="text-slate-400 font-medium ml-1 capitalize">• {currentItem.payment.type}</span>
              </p>

              <button
                onClick={handleSendNext}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
                {processing ? "Generating & Opening..." : "Send via WhatsApp"}
              </button>
              
              <button 
                onClick={() => setCurrentIndex(prev => prev + 1)} 
                className="mt-6 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
              >
                Skip this member
              </button>
              
              <div className="mt-8 text-xs text-left text-amber-800 bg-amber-50 p-4 rounded-xl ring-1 ring-inset ring-amber-600/20 font-medium leading-relaxed">
                <strong className="block mb-1">High-Speed Workflow:</strong>
                Click Send for each member. The receipt image is instantly <strong>copied to your clipboard</strong>. When WhatsApp Web opens, simply press <strong>Paste (Cmd + V)</strong> and hit enter to send!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
