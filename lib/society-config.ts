/**
 * Society Configuration
 * 
 * All society-specific details are centralized here.
 * Update this file when society details change (committee elections, address change, etc.)
 */

export const SOCIETY_CONFIG = {
  name: "Swati Society House Owners Association",
  subtitle: "A & B - Blocks",
  address: "Next to Sama Sports Complex, New Sama Road, Sama, Vadodara – 390 024",
  email: "swatisociety@gmail.com",
  logo: "SWATI",

  // Annual maintenance amount (same for all members)
  maintenanceAmount: 12000,

  // Governing body
  governingBody: [
    { role: "President", name: "M S Kapoor" },
    { role: "Vice-President", name: "H K Parmar" },
    { role: "Secretary", name: "B J Mahida" },
    { role: "Asst. Secretary", name: "M J Shah" },
    { role: "Treasurer", name: "A S Pandya" },
    { role: "Asst Treasurer", name: "K V Solanki" },
  ],

  // Executive members
  executiveMembers: [
    "Shail Shah",
    "Arpit Patel",
    "Dr. Chintan Modi",
    "Radhe Pandya",
    "Rushi Vyas",
    "Nikunj Mojidra",
    "Vishal Aghera",
    "Smt. Priti Parikh",
    "Smt. Vidya Mahida",
  ],
}

/**
 * Get financial year periods for dropdown
 * Generates list from 2023-24 to current+1 FY year
 */
export function getFinancialYears(): string[] {
  const now = new Date()
  const currentYear = now.getFullYear()
  // FY starts in April. If we're past April, current FY is currentYear-nextYear
  const currentFYStart = now.getMonth() >= 3 ? currentYear : currentYear - 1
  
  const years: string[] = []
  for (let start = 2023; start <= currentFYStart + 1; start++) {
    const end = (start + 1) % 100 // Get last 2 digits
    years.push(`${start}-${end.toString().padStart(2, "0")}`)
  }
  return years.reverse() // Most recent first
}

/**
 * Get the current financial year string
 */
export function getCurrentFinancialYear(): string {
  const now = new Date()
  const currentYear = now.getFullYear()
  const startYear = now.getMonth() >= 3 ? currentYear : currentYear - 1
  const endYear = (startYear + 1) % 100
  return `${startYear}-${endYear.toString().padStart(2, "0")}`
}

export type PaymentMode = "cash" | "online" | "upi" | "cheque"

export const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "online", label: "Online Transfer" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
]
