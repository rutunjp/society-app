"use client"
import { useState } from "react"
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline"
import { generateReceiptImage, ReceiptData } from "@/lib/pdf-generator"
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
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [blobRef, setBlobRef] = useState<Blob | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try {
      const blob = await generateReceiptImage(receiptData)
      const url = URL.createObjectURL(blob)
      setImageUrl(url)
      setBlobRef(blob)
      setGenerated(true)
    } catch {
      toast.error("Failed to generate receipt image")
    } finally {
      setGenerating(false)
    }
  }

  function handleDownload() {
    if (!imageUrl) return
    const a = document.createElement("a")
    a.href = imageUrl
    a.download = `Receipt_${receiptData.receiptNo}.jpg`
    a.click()
    toast.success("Receipt image downloaded!")
  }

  function handleWhatsApp() {
    if (!blobRef) {
      toast.error("Generate receipt first")
      return
    }

    // Download first
    handleDownload()

    // Build WhatsApp message
    const typeLabel =
      receiptData.paymentType === "event"
        ? receiptData.eventName || "Event"
        : "Maintenance"
    const periodStr = receiptData.period ? ` for FY ${receiptData.period}` : ""

    const text = `Hello ${receiptData.memberName},\n\nThis is a confirmation that we have received your payment of ₹${receiptData.amount.toLocaleString("en-IN")} towards ${typeLabel}${periodStr} on ${receiptData.date}.\n\n*This is an electronically generated receipt.*\n\nPlease find the receipt image attached to this message.\n\nThank you!\nSociety Committee`

    let phoneNum = phoneNumber?.replace(/\D/g, "") || ""
    if (phoneNum.length === 10) {
      phoneNum = `91${phoneNum}`
    }

    setTimeout(() => {
      window.open(
        `https://wa.me/${phoneNum}?text=${encodeURIComponent(text)}`,
        "_blank"
      )
    }, 500)
  }

  function handleClose() {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageUrl(null)
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-indigo-50 p-4 rounded-full mb-4">
                <ArrowDownTrayIcon className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">
                Generate Receipt
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">
                Create a receipt image for{" "}
                <strong>₹{receiptData.amount.toLocaleString("en-IN")}</strong>{" "}
                payment by {receiptData.memberName}
              </p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {generating ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  "Generate Receipt Image"
                )}
              </button>
            </div>
          ) : (
            <div>
              {imageUrl && (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Payment Receipt"
                    className="w-full"
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
