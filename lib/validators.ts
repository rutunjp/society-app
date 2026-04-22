import { getAllRows } from "./sheets"
import { getSocietyConfigStore } from "@/lib/society-config.server"
import { rowBelongsToSociety } from "@/lib/tenant"

const MEMBER_SOCIETY_COLUMN = 6
const EVENT_SOCIETY_COLUMN = 4

// Returns error message or null if valid
export async function validateMember(data: {
  society_id?: string
  name?: string
  flat_no?: string
  phone?: string
  email?: string
  type?: string
}, excludeId?: string): Promise<string | null> {
  const { society_id, name, flat_no, phone, type } = data

  if (!society_id || !name || !flat_no || !phone || !type) {
    return "All fields are required: society_id, name, flat_no, phone, type"
  }

  if (!["owner", "tenant"].includes(type)) {
    return "type must be 'owner' or 'tenant'"
  }

  // Check flat_no uniqueness
  const { defaultSocietyId } = await getSocietyConfigStore()
  const rows = await getAllRows("Members")
  const duplicate = rows.find(
    (row) =>
      rowBelongsToSociety(row, society_id, MEMBER_SOCIETY_COLUMN, defaultSocietyId) &&
      row[2]?.toLowerCase() === flat_no.toLowerCase() &&
      row[0] !== excludeId
  )
  if (duplicate) {
    return `flat_no '${flat_no}' already exists`
  }

  return null
}

export async function validatePayment(data: {
  society_id?: string
  member_id?: string
  type?: string
  event_id?: string
  amount?: number | string
  status?: string
  date?: string
  period?: string
  payment_mode?: string
}): Promise<string | null> {
  const { society_id, member_id, type, event_id, amount, status, date, period, payment_mode } = data

  if (!society_id || !member_id || !type || !amount || !status || !date) {
    return "All fields are required: society_id, member_id, type, amount, status, date"
  }

  if (!["maintenance", "event"].includes(type)) {
    return "type must be 'maintenance' or 'event'"
  }

  if (type === "maintenance" && !period) {
    return "period is required for maintenance payments (e.g. '2025-26')"
  }

  if (type === "event" && !event_id) {
    return "event_id is required when type is 'event'"
  }

  if (payment_mode && !["cash", "online", "upi", "cheque"].includes(payment_mode)) {
    return "payment_mode must be 'cash', 'online', 'upi', or 'cheque'"
  }

  if (Number(amount) <= 0) {
    return "amount must be greater than 0"
  }

  if (!["paid", "pending"].includes(status)) {
    return "status must be 'paid' or 'pending'"
  }

  // Check member_id exists
  const { defaultSocietyId } = await getSocietyConfigStore()
  const memberRows = await getAllRows("Members")
  const memberExists = memberRows.find(
    (row) =>
      rowBelongsToSociety(row, society_id, MEMBER_SOCIETY_COLUMN, defaultSocietyId) &&
      row[0] === member_id
  )
  if (!memberExists) {
    return `member_id '${member_id}' does not exist`
  }

  // If event type, check event_id exists
  if (type === "event" && event_id) {
    const eventRows = await getAllRows("Events")
    const eventExists = eventRows.find(
      (row) =>
        rowBelongsToSociety(row, society_id, EVENT_SOCIETY_COLUMN, defaultSocietyId) &&
        row[0] === event_id
    )
    if (!eventExists) {
      return `event_id '${event_id}' does not exist`
    }
  }

  return null
}

export async function validateEvent(data: {
  society_id?: string
  name?: string
  expected_amount?: number | string
  date?: string
}): Promise<string | null> {
  const { society_id, name, expected_amount, date } = data

  if (!society_id || !name || !expected_amount || !date) {
    return "All fields are required: society_id, name, expected_amount, date"
  }

  if (Number(expected_amount) <= 0) {
    return "expected_amount must be greater than 0"
  }

  return null
}

export async function validateExpense(data: {
  society_id?: string
  event_id?: string
  title?: string
  amount?: number | string
  notes?: string
  category?: string
}): Promise<string | null> {
  const { society_id, event_id, title, amount, category } = data

  if (!society_id || !event_id || !title || !amount || !category) {
    return "All fields are required: society_id, event_id, title, amount, category"
  }

  if (Number(amount) <= 0) {
    return "amount must be greater than 0"
  }

  // Check event_id exists
  const { defaultSocietyId } = await getSocietyConfigStore()
  const eventRows = await getAllRows("Events")
  const eventExists = eventRows.find(
    (row) =>
      rowBelongsToSociety(row, society_id, EVENT_SOCIETY_COLUMN, defaultSocietyId) &&
      row[0] === event_id
  )
  if (!eventExists) {
    return `event_id '${event_id}' does not exist`
  }

  return null
}
