import {
  appendRow,
  deleteRow,
  ensureSheetWithHeaders,
  getAllRows,
  getNextId,
  updateRowById,
} from "@/lib/sheets"
import { getSocietyConfigStore } from "@/lib/society-config.server"
import { AppUser, UserRole, UserStatus } from "@/types"

const USERS_SHEET = "Users"
const USER_HEADERS = ["id", "society_id", "name", "email", "role", "status"]

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function rowToUser(row: string[], defaultSocietyId: string): AppUser {
  return {
    id: row[0] || "",
    society_id: row[1] || defaultSocietyId,
    name: row[2] || "",
    email: normalizeEmail(row[3] || ""),
    role: (row[4] as UserRole) || "committee_member",
    status: (row[5] as UserStatus) || "invited",
  }
}

async function getUserRows(): Promise<AppUser[]> {
  await ensureSheetWithHeaders(USERS_SHEET, USER_HEADERS)
  const { defaultSocietyId } = await getSocietyConfigStore()
  const rows = await getAllRows(USERS_SHEET)
  return rows.map((row) => rowToUser(row, defaultSocietyId))
}

export async function findUserByEmail(email: string): Promise<AppUser | null> {
  const users = await getUserRows()
  return users.find((user) => user.email === normalizeEmail(email)) || null
}

export async function getSocietyUsers(societyId: string): Promise<AppUser[]> {
  const users = await getUserRows()
  return users.filter((user) => user.society_id === societyId)
}

export async function createUser(input: {
  society_id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
}): Promise<AppUser> {
  await ensureSheetWithHeaders(USERS_SHEET, USER_HEADERS)

  const existingUser = await findUserByEmail(input.email)
  if (existingUser) {
    throw new Error("A user with this email is already registered")
  }

  const id = await getNextId(USERS_SHEET)
  const email = normalizeEmail(input.email)
  const row = [id, input.society_id, input.name, email, input.role, input.status]
  await appendRow(USERS_SHEET, row)

  return {
    id,
    society_id: input.society_id,
    name: input.name,
    email,
    role: input.role,
    status: input.status,
  }
}

export async function updateUser(input: {
  id: string
  name?: string
  role?: UserRole
  status?: UserStatus
}): Promise<AppUser> {
  const users = await getUserRows()
  const existingUser = users.find((user) => user.id === input.id)
  if (!existingUser) {
    throw new Error("User not found")
  }

  const updatedUser: AppUser = {
    ...existingUser,
    name: input.name ?? existingUser.name,
    role: input.role ?? existingUser.role,
    status: input.status ?? existingUser.status,
  }

  await updateRowById(USERS_SHEET, input.id, [
    updatedUser.id,
    updatedUser.society_id,
    updatedUser.name,
    updatedUser.email,
    updatedUser.role,
    updatedUser.status,
  ])

  return updatedUser
}

export async function activateUserForSignIn(input: {
  email: string
  name?: string | null
}): Promise<AppUser | null> {
  const existingUser = await findUserByEmail(input.email)
  if (!existingUser) return null

  const nextName = input.name?.trim() || existingUser.name
  const nextStatus: UserStatus = "active"

  if (nextName !== existingUser.name || nextStatus !== existingUser.status) {
    return updateUser({
      id: existingUser.id,
      name: nextName,
      status: nextStatus,
    })
  }

  return existingUser
}

export async function deleteUser(userId: string): Promise<void> {
  await ensureSheetWithHeaders(USERS_SHEET, USER_HEADERS)
  await deleteRow(USERS_SHEET, userId)
}

export async function ensureCoreDataSheets(): Promise<void> {
  await Promise.all([
    ensureSheetWithHeaders("Members", [
      "id",
      "name",
      "flat_no",
      "phone",
      "email",
      "type",
      "society_id",
    ]),
    ensureSheetWithHeaders("Payments", [
      "id",
      "member_id",
      "type",
      "event_id",
      "amount",
      "status",
      "date",
      "period",
      "payment_mode",
      "society_id",
    ]),
    ensureSheetWithHeaders("Events", [
      "id",
      "name",
      "expected_amount",
      "date",
      "society_id",
    ]),
    ensureSheetWithHeaders("Expenses", [
      "id",
      "event_id",
      "title",
      "amount",
      "notes",
      "category",
      "society_id",
    ]),
    ensureSheetWithHeaders(USERS_SHEET, USER_HEADERS),
  ])
}
