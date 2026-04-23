"use client"
import { useState, useEffect } from "react"
import LoadingSpinner from "@/components/LoadingSpinner"
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline"
import { useSociety } from './SocietyProvider';
import { generateReceiptPDF, ReceiptData } from "@/lib/pdf-generator"
import { toast } from "react-hot-toast"

interface ReceiptPreviewProps {
  open: boolean
  onClose: () => void
  receiptData: ReceiptData
  phoneNumber?: string
}

export default function ReceiptPreview({
  open,
  onClose,
  receiptData,
  phoneNumber,
}: ReceiptPreviewProps) {
  const { activeSociety } = useSociety();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [blobRef, setBlobRef] = useState<Blob | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  useEffect(() => {
    if (open && !pdfUrl && !generating) {
      handleGenerate()
    }
  }, [open])

  async function handleGenerate() {
    setGenerating(true)
    try {
      const blob = await generateReceiptPDF(receiptData, activeSociety as any)
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      setBlobRef(blob)
      setGenerated(true)
    } catch {
      toast.error("Failed to generate receipt PDF")
    } finally {
      setGenerating(false)
    }
  }

  function handleDownload() {
    if (!pdfUrl) return
    const a = document.createElement("a")
    a.href = pdfUrl
    const safeReceiptNo = receiptData.receiptNo.replace(/\//g, "-")
    const safeMemberName = receiptData.memberName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")
    a.download = `Receipt_${safeReceiptNo}_${safeMemberName}.pdf`
    a.click()
    toast.success("Receipt PDF downloaded!")
  }

  async function handleWhatsApp() {
    if (!blobRef) {
      toast.error("Generate receipt first")
      return
    }

    // Build WhatsApp message
    const typeLabel =
      receiptData.paymentType === "event"
        ? receiptData.eventName || "Event"
        : "Maintenance"
    const periodStr = receiptData.period ? ` for FY ${receiptData.period}` : ""

    const text = `Hello ${receiptData.memberName},\n\nThis is a confirmation that we have received your payment of ₹${receiptData.amount.toLocaleString("en-IN")} towards ${typeLabel}${periodStr} on ${receiptData.date}.\n\n*This is an electronically generated receipt.*\n\nPlease find the receipt PDF attached.\n\nThank you!\nSociety Committee`

    // 1. Try Native Web Share API (Best for Mobile)
    if (typeof navigator !== "undefined" && navigator.canShare) {
      const safeReceiptNo = receiptData.receiptNo.replace(/\//g, "-")
      const safeMemberName = receiptData.memberName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")
      const fileName = `Receipt_${safeReceiptNo}_${safeMemberName}.pdf`
      const file = new File([blobRef], fileName, { type: "application/pdf" })
      const shareData = {
        title: "Payment Receipt",
        text: text,
        files: [file],
      }
      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData)
          return
        } catch (error) {
          if ((error as Error).name !== "AbortError") {
            console.error("Error sharing:", error)
          }
          return
        }
      }
    }

    // 2. Fallback (Download + WhatsApp Web)
    handleDownload()

    let phoneNum = phoneNumber?.replace(/\D/g, "") || ""
    if (phoneNum.length === 10) {
      phoneNum = `91${phoneNum}`
    }

    const waUrl = `https://wa.me/${phoneNum}?text=${encodeURIComponent(text)}`
    window.open(waUrl, "_blank", "noopener,noreferrer")
  }

  function handleClose() {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    setPdfUrl(null)
    setBlobRef(null)
    setGenerated(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Payment Receipt
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {receiptData.memberName} · Flat {receiptData.flatNo}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!generated ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <LoadingSpinner />
              <h3 className="text-base font-medium text-gray-900 mt-6 mb-1">
                Generating Receipt
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Preparing the official PDF receipt...
              </p>
            </div>
          ) : (
            <div>
              {pdfUrl && (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm h-[500px]">
                  <iframe
                    src={`${pdfUrl}#toolbar=0`}
                    title="Payment Receipt PDF"
                    className="w-full h-full border-0"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {generated && (
          <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Share via WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
