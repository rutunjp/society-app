import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface ReceiptData {
  receiptNo: string
  date: string
  memberName: string
  flatNo: string
  amount: number
  paymentType: string
  eventName?: string
  receivedBy: string
}

export async function generateReceiptPDF(data: ReceiptData) {
  // Create a temporary container for height/width scale
  const container = document.createElement("div")
  container.style.position = "fixed"
  container.style.left = "-9999px"
  container.style.top = "0"
  container.style.width = "800px" // Standard A4 width approx in px at 96dpi
  container.style.backgroundColor = "white"
  container.style.padding = "40px"
  container.style.fontFamily = "'Times New Roman', serif"
  container.style.color = "#333"

  const typeLabel = data.paymentType === "event" ? data.eventName : "Maintenance"

  container.innerHTML = `
    <div style="border: 2px solid #eee; padding: 20px; position: relative; min-height: 1000px;">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px solid #fecaca; padding-bottom: 10px; margin-bottom: 20px;">
        <h1 style="color: #0ea5e9; font-size: 28px; margin: 0; font-family: sans-serif;">Swati Society House Owners Association</h1>
        <h2 style="color: #0ea5e9; font-size: 20px; margin: 5px 0; font-family: sans-serif;">A & B - Blocks</h2>
        <p style="color: #0ea5e9; font-size: 14px; margin: 5px 0; font-weight: bold;">Next to Sama Sports Complex, New Sama Road, Sama, Vadodara – 390 024</p>
        <p style="color: #7c3aed; font-size: 12px; margin: 0;">e-mail: swatisociety@gmail.com</p>
      </div>

      <div style="display: flex;">
        <!-- Left Sidebar (Governing Body) -->
        <div style="width: 200px; border-right: 1px solid #fecaca; padding-right: 15px; font-size: 12px; line-height: 1.4;">
          <h3 style="color: #ef4444; font-size: 14px; margin-bottom: 5px;">Governing Body</h3>
          <p><i>President</i><br><b>M S Kapoor</b></p>
          <p><i>Vice- President</i><br><b>H K Parmar</b></p>
          <p><i>Secretary</i><br><b>B J Mahida</b></p>
          <p><i>Asst. Secretary</i><br><b>M J Shah</b></p>
          <p><i>Treasurer</i><br><b>A S Pandya</b></p>
          <p><i>Asst Treasurer</i><br><b>K V Solanki</b></p>

          <h3 style="color: #ef4444; font-size: 14px; margin-top: 20px; margin-bottom: 5px;">Executive Members</h3>
          <p><b>Shail Shah</b></p>
          <p><b>Arpit Patel</b></p>
          <p><b>Dr. Chintan Modi</b></p>
          <p><b>Radhe Pandya</b></p>
          <p><b>Rushi Vyas</b></p>
          <p><b>Nikunj Mojidra</b></p>
          <p><b>Vishal Aghera</b></p>
          <p><b>Smt. Priti Parikh</b></p>
          <p><b>Smt. Vidya Mahida</b></p>
        </div>

        <!-- Right Content (Receipt Details) -->
        <div style="flex: 1; padding-left: 40px; padding-top: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
            <div style="font-size: 16px;"><b>Receipt No:</b> #${data.receiptNo}</div>
            <div style="font-size: 16px;"><b>Date:</b> ${data.date}</div>
          </div>

          <h2 style="text-align: center; text-decoration: underline; margin-bottom: 40px; color: #111;">PAYMENT RECEIPT</h2>

          <div style="font-size: 18px; line-height: 2;">
            <p>Received with thanks from <b>${data.memberName}</b> (Flat No: <b>${data.flatNo}</b>)</p>
            <p>The sum of <b>₹${data.amount.toLocaleString("en-IN")}</b></p>
            <p>Towards: <b>${typeLabel}</b></p>
            <p>Payment Mode: <b>Online / Cash</b></p>
          </div>

          <div style="margin-top: 100px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <p style="font-size: 11px; color: #666; font-style: italic; margin-bottom: 5px;">* This is an electronically generated receipt.</p>
            </div>
            <div style="text-align: center;">
              <div style="height: 60px;"></div>
              <p style="border-top: 1px solid #333; padding-top: 10px; width: 200px;">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Logo -->
      <div style="position: absolute; bottom: 30px; right: 30px; display: flex; align-items: center; gap: 10px;">
        <span style="font-family: sans-serif; font-weight: 900; color: #84cc16; font-size: 32px; letter-spacing: -1px;">SWATI</span>
      </div>
    </div>
  `

  document.body.appendChild(container)
  
  const canvas = await html2canvas(container, { scale: 2 })
  const imgData = canvas.toDataURL("image/png")
  
  const pdf = new jsPDF("p", "mm", "a4")
  const imgProps = pdf.getImageProperties(imgData)
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
  
  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
  
  document.body.removeChild(container)
  return pdf
}
