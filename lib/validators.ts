import { getAllRows } from "./sheets"

// Returns error message or null if valid
export async function validateMember(data: {
  name?: string
  flat_no?: string
  phone?: string
  email?: string
  type?: string
}): Promise<string | null> {
  const { name, flat_no, phone, email, type } = data

  if (!name || !flat_no || !phone || !email || !type) {
    return "All fields are required: name, flat_no, phone, email, type"
  }

  if (!["owner", "tenant"].includes(type)) {
    return "type must be 'owner' or 'tenant'"
  }

  // Check flat_no uniqueness
  const rows = await getAllRows("Members")
  const duplicate = rows.find(
    (row) => row[2]?.toLowerCase() === flat_no.toLowerCase()
  )
  if (duplicate) {
    return `flat_no '${flat_no}' already exists`
  }

  return null
}

export async function validatePayment(data: {
  member_id?: string
  type?: string
  event_id?: string
  amount?: number | string
  status?: string
  date?: string
  period?: string
  payment_mode?: string
}): Promise<string | null> {
  const { member_id, type, event_id, amount, status, date, period, payment_mode } = data

  if (!member_id || !type || !amount || !status || !date) {
    return "All fields are required: member_id, type, amount, status, date"
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
  const memberRows = await getAllRows("Members")
  const memberExists = memberRows.find((row) => row[0] === member_id)
  if (!memberExists) {
    return `member_id '${member_id}' does not exist`
  }

  // If event type, check event_id exists
  if (type === "event" && event_id) {
    const eventRows = await getAllRows("Events")
    const eventExists = eventRows.find((row) => row[0] === event_id)
    if (!eventExists) {
      return `event_id '${event_id}' does not exist`
    }
  }

  return null
}

export async function validateEvent(data: {
  name?: string
  expected_amount?: number | string
  date?: string
}): Promise<string | null> {
  const { name, expected_amount, date } = data

  if (!name || !expected_amount || !date) {
    return "All fields are required: name, expected_amount, date"
  }

  if (Number(expected_amount) <= 0) {
    return "expected_amount must be greater than 0"
  }

  return null
}

export async function validateExpense(data: {
  event_id?: string
  title?: string
  amount?: number | string
  notes?: string
}): Promise<string | null> {
  const { event_id, title, amount } = data

  if (!event_id || !title || !amount) {
    return "All fields are required: event_id, title, amount"
  }

  if (Number(amount) <= 0) {
    return "amount must be greater than 0"
  }

  // Check event_id exists
  const eventRows = await getAllRows("Events")
  const eventExists = eventRows.find((row) => row[0] === event_id)
  if (!eventExists) {
    return `event_id '${event_id}' does not exist`
  }

  return null
}
