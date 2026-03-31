export interface Member {
  id: string
  name: string
  flat_no: string
  phone: string
  email: string
  type: "owner" | "tenant"
}

export interface Payment {
  id: string
  member_id: string
  type: "maintenance" | "event"
  event_id: string        // empty string "" if type is maintenance
  amount: number
  status: "paid" | "pending"
  date: string            // ISO format: YYYY-MM-DD
}

export interface Event {
  id: string
  name: string
  expected_amount: number
  date: string            // ISO format: YYYY-MM-DD
}

export interface Expense {
  id: string
  event_id: string
  title: string
  amount: number
  notes: string
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
