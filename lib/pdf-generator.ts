import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import { DEFAULT_SOCIETY_CONFIG } from "./society-config"
import { SocietyConfig } from "@/types"

export interface ReceiptData {
  receiptNo: string
  date: string
  memberName: string
  flatNo: string
  amount: number
  paymentType: string
  eventName?: string
  period?: string
  paymentMode?: string
  receivedBy: string
}

async function getReceiptCanvas(
  data: ReceiptData,
  config: SocietyConfig = DEFAULT_SOCIETY_CONFIG
): Promise<HTMLCanvasElement> {
  const typeLabel = data.paymentType === "event" ? data.eventName : "Maintenance"
  const periodStr = data.period ? ` (FY ${data.period})` : ""
  const modeStr = data.paymentMode
    ? data.paymentMode.charAt(0).toUpperCase() + data.paymentMode.slice(1)
    : "Cash / Online"

  const receiptNo = data.period
    ? `${config.logo}/${data.period}/${data.receiptNo.padStart(3, "0")}`
    : `#${data.receiptNo}`

  const govBodyHtml = config.governingBody
    .map((m) => `<p style="margin: 4px 0;"><i>${m.role}</i><br><b>${m.name}</b></p>`)
    .join("")

  const execMembersHtml = config.executiveMembers
    .map((name) => `<p style="margin: 3px 0;"><b>${name}</b></p>`)
    .join("")

  const wrapper = document.createElement("div")
  wrapper.style.cssText = "position:absolute;top:0;left:0;width:0;height:0;overflow:hidden;"

  const container = document.createElement("div")
  container.style.cssText = [
    "width:800px",
    "background:white",
    "padding:40px",
    "font-family:'Times New Roman',serif",
    "color:#333",
    "box-sizing:border-box",
  ].join(";")

  wrapper.appendChild(container)

  container.innerHTML = `
    <div style="border: 2px solid #eee; padding: 20px; position: relative; min-height: 960px;">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px solid #fecaca; padding-bottom: 10px; margin-bottom: 20px;">
        <h1 style="color: #0ea5e9; font-size: 26px; margin: 0; font-family: sans-serif;">${config.name}</h1>
        <h2 style="color: #0ea5e9; font-size: 18px; margin: 5px 0; font-family: sans-serif;">${config.subtitle}</h2>
        <p style="color: #0ea5e9; font-size: 13px; margin: 5px 0; font-weight: bold;">${config.address}</p>
        <p style="color: #7c3aed; font-size: 12px; margin: 0;">e-mail: ${config.email}</p>
      </div>

      <div style="display: flex;">
        <!-- Left Sidebar -->
        <div style="width: 190px; border-right: 1px solid #fecaca; padding-right: 14px; font-size: 11px; line-height: 1.5;">
          <h3 style="color: #ef4444; font-size: 13px; margin-bottom: 4px;">Governing Body</h3>
          ${govBodyHtml}

          <h3 style="color: #ef4444; font-size: 13px; margin-top: 18px; margin-bottom: 4px;">Executive Members</h3>
          ${execMembersHtml}
        </div>

        <!-- Right Content -->
        <div style="flex: 1; padding-left: 36px; padding-top: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 32px;">
            <div style="font-size: 15px;"><b>Receipt No:</b> ${receiptNo}</div>
            <div style="font-size: 15px;"><b>Date:</b> ${data.date}</div>
          </div>

          <h2 style="text-align: center; text-decoration: underline; margin-bottom: 36px; color: #111; font-size: 20px;">PAYMENT RECEIPT</h2>

          <div style="font-size: 17px; line-height: 2;">
            <p>Received with thanks from <b>${data.memberName}</b> (Flat No: <b>${data.flatNo}</b>)</p>
            <p>The sum of <b>₹${data.amount.toLocaleString("en-IN")}</b></p>
            <p>Towards: <b>${typeLabel}${periodStr}</b></p>
            <p>Payment Mode: <b>${modeStr}</b></p>
          </div>

          <div style="margin-top: 80px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <p style="font-size: 11px; color: #666; font-style: italic;">* This is an electronically generated receipt.</p>
            </div>
            <div style="text-align: center;">
              <p style="padding-top: 8px; width: 180px; margin: 0; font-size: 14px;"><b>For ${config.name}</b><br><span style="font-size: 13px; color: #555;">Society Committee</span></p>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Logo -->
      <div style="position: absolute; bottom: 24px; right: 24px;">
        <span style="font-family: sans-serif; font-weight: 900; color: #84cc16; font-size: 28px; letter-spacing: -1px;">${config.logo}</span>
      </div>
    </div>
  `

  document.body.appendChild(wrapper)
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    width: 800,
  })
  document.body.removeChild(wrapper)
  return canvas
}

export async function generateReceiptImage(
  data: ReceiptData,
  config?: SocietyConfig
): Promise<Blob> {
  const canvas = await getReceiptCanvas(data, config)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error("Failed to create blob"))
    }, "image/png")
  })
}

export async function generateReceiptPDF(
  data: ReceiptData,
  config?: SocietyConfig
): Promise<Blob> {
  const canvas = await getReceiptCanvas(data, config)
  const imgData = canvas.toDataURL("image/jpeg", 0.95)
  const pdf = new jsPDF("p", "mm", "a4")
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width
  
  pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight)
  return pdf.output("blob")
}
