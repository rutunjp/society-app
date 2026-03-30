import html2canvas from "html2canvas"

export interface ReceiptData {
  receiptNo: string
  date: string
  memberName: string
  flatNo: string
  amount: number
  paymentType: string
  eventName?: string
  receivedBy: string
}

/** Generates a JPEG blob of the payment receipt */
export async function generateReceiptImage(data: ReceiptData): Promise<Blob> {
  const typeLabel = data.paymentType === "event" ? data.eventName : "Maintenance"

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
        <h1 style="color: #0ea5e9; font-size: 26px; margin: 0; font-family: sans-serif;">Swati Society House Owners Association</h1>
        <h2 style="color: #0ea5e9; font-size: 18px; margin: 5px 0; font-family: sans-serif;">A &amp; B - Blocks</h2>
        <p style="color: #0ea5e9; font-size: 13px; margin: 5px 0; font-weight: bold;">Next to Sama Sports Complex, New Sama Road, Sama, Vadodara – 390 024</p>
        <p style="color: #7c3aed; font-size: 12px; margin: 0;">e-mail: swatisociety@gmail.com</p>
      </div>

      <div style="display: flex;">
        <!-- Left Sidebar -->
        <div style="width: 190px; border-right: 1px solid #fecaca; padding-right: 14px; font-size: 11px; line-height: 1.5;">
          <h3 style="color: #ef4444; font-size: 13px; margin-bottom: 4px;">Governing Body</h3>
          <p style="margin: 4px 0;"><i>President</i><br><b>M S Kapoor</b></p>
          <p style="margin: 4px 0;"><i>Vice-President</i><br><b>H K Parmar</b></p>
          <p style="margin: 4px 0;"><i>Secretary</i><br><b>B J Mahida</b></p>
          <p style="margin: 4px 0;"><i>Asst. Secretary</i><br><b>M J Shah</b></p>
          <p style="margin: 4px 0;"><i>Treasurer</i><br><b>A S Pandya</b></p>
          <p style="margin: 4px 0;"><i>Asst Treasurer</i><br><b>K V Solanki</b></p>

          <h3 style="color: #ef4444; font-size: 13px; margin-top: 18px; margin-bottom: 4px;">Executive Members</h3>
          <p style="margin: 3px 0;"><b>Shail Shah</b></p>
          <p style="margin: 3px 0;"><b>Arpit Patel</b></p>
          <p style="margin: 3px 0;"><b>Dr. Chintan Modi</b></p>
          <p style="margin: 3px 0;"><b>Radhe Pandya</b></p>
          <p style="margin: 3px 0;"><b>Rushi Vyas</b></p>
          <p style="margin: 3px 0;"><b>Nikunj Mojidra</b></p>
          <p style="margin: 3px 0;"><b>Vishal Aghera</b></p>
          <p style="margin: 3px 0;"><b>Smt. Priti Parikh</b></p>
          <p style="margin: 3px 0;"><b>Smt. Vidya Mahida</b></p>
        </div>

        <!-- Right Content -->
        <div style="flex: 1; padding-left: 36px; padding-top: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 32px;">
            <div style="font-size: 15px;"><b>Receipt No:</b> #${data.receiptNo}</div>
            <div style="font-size: 15px;"><b>Date:</b> ${data.date}</div>
          </div>

          <h2 style="text-align: center; text-decoration: underline; margin-bottom: 36px; color: #111; font-size: 20px;">PAYMENT RECEIPT</h2>

          <div style="font-size: 17px; line-height: 2;">
            <p>Received with thanks from <b>${data.memberName}</b> (Flat No: <b>${data.flatNo}</b>)</p>
            <p>The sum of <b>₹${data.amount.toLocaleString("en-IN")}</b></p>
            <p>Towards: <b>${typeLabel}</b></p>
            <p>Payment Mode: <b>Online / Cash</b></p>
          </div>

          <div style="margin-top: 80px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <p style="font-size: 11px; color: #666; font-style: italic;">* This is an electronically generated receipt.</p>
            </div>
            <div style="text-align: center;">
              <div style="height: 50px;"></div>
              <p style="border-top: 1px solid #333; padding-top: 8px; width: 180px; margin: 0;">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Logo -->
      <div style="position: absolute; bottom: 24px; right: 24px;">
        <span style="font-family: sans-serif; font-weight: 900; color: #84cc16; font-size: 28px; letter-spacing: -1px;">SWATI</span>
      </div>
    </div>
  `

  document.body.appendChild(wrapper)
  const canvas = await html2canvas(container, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    width: 800,
  })
  document.body.removeChild(wrapper)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Failed to generate image"))
      },
      "image/jpeg",
      0.82
    )
  })
}
