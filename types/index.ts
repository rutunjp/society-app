export interface Society {
  id: string
  name: string
  subtitle?: string
  address: string
  email?: string
  logo?: string
  maintenance_amount: number
  governing_body: any[]
  executive_members: any[]
}

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
  event_id: string | null
  amount: number
  status: "paid" | "pending"
  date: string            // ISO format: YYYY-MM-DD
  period: string | null
  payment_mode: string | null
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
  notes: string | null
  category: string
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
