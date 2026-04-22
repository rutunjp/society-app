export interface Member {
  id: string
  society_id: string
  name: string
  flat_no: string
  phone: string
  email?: string
  type: "owner" | "tenant"
}

export interface Payment {
  id: string
  society_id: string
  member_id: string
  type: "maintenance" | "event"
  event_id: string        // empty string "" if type is maintenance
  amount: number
  status: "paid" | "pending"
  date: string            // ISO format: YYYY-MM-DD
  period: string          // Financial year: "2025-26"
  payment_mode: string    // "cash" | "online" | "upi" | "cheque"
}

export interface Event {
  id: string
  society_id: string
  name: string
  expected_amount: number
  date: string            // ISO format: YYYY-MM-DD
}

export interface Expense {
  id: string
  society_id: string
  event_id: string
  title: string
  amount: number
  notes: string
  category: string
}

export interface GoverningBodyMember {
  role: string
  name: string
}

export interface SocietyConfig {
  name: string
  subtitle: string
  address: string
  email: string
  logo: string
  maintenanceAmount: number
  governingBody: GoverningBodyMember[]
  executiveMembers: string[]
}

export interface SocietySummary extends SocietyConfig {
  id: string
}

export interface SocietyConfigStore {
  defaultSocietyId: string
  societies: SocietySummary[]
}

export type UserRole =
  | "president"
  | "secretary"
  | "treasurer"
  | "committee_member"
  | "auditor"

export type UserStatus = "active" | "invited"

export interface AppUser {
  id: string
  society_id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
}

// API response wrappers
export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
