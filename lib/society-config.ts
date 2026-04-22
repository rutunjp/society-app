import { SocietyConfig } from "@/types"

export const DEFAULT_SOCIETY_ID = "default-society"

export const DEFAULT_SOCIETY_CONFIG: SocietyConfig = {
  name: "Swati Society House Owners Association",
  subtitle: "A & B - Blocks",
  address: "Next to Sama Sports Complex, New Sama Road, Sama, Vadodara – 390 024",
  email: "swatisociety@gmail.com",
  logo: "SWATI",
  maintenanceAmount: 12000,
  governingBody: [
    { role: "President", name: "M S Kapoor" },
    { role: "Vice-President", name: "H K Parmar" },
    { role: "Secretary", name: "B J Mahida" },
    { role: "Asst. Secretary", name: "M J Shah" },
    { role: "Treasurer", name: "A S Pandya" },
    { role: "Asst Treasurer", name: "K V Solanki" },
  ],
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

export const SOCIETY_CONFIG = DEFAULT_SOCIETY_CONFIG

export function createEmptySocietyConfig(): SocietyConfig {
  return {
    name: "",
    subtitle: "",
    address: "",
    email: "",
    logo: "",
    maintenanceAmount: 0,
    governingBody: [],
    executiveMembers: [],
  }
}

export function slugifySocietyId(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return normalized || DEFAULT_SOCIETY_ID
}

export function getFinancialYears(): string[] {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentFYStart = now.getMonth() >= 3 ? currentYear : currentYear - 1

  const years: string[] = []
  for (let start = 2023; start <= currentFYStart + 1; start++) {
    const end = (start + 1) % 100
    years.push(`${start}-${end.toString().padStart(2, "0")}`)
  }
  return years.reverse()
}

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
