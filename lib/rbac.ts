import { UserRole } from "@/types"

export type Permission =
  | "view_members"
  | "manage_members"
  | "view_payments"
  | "manage_payments"
  | "view_events"
  | "manage_events"
  | "view_expenses"
  | "manage_expenses"
  | "view_society"
  | "manage_society"
  | "manage_users"

export const ROLE_OPTIONS: {
  value: UserRole
  label: string
  description: string
}[] = [
  {
    value: "president",
    label: "President / Chairperson",
    description: "Society head with full control over users, settings, finance, and operations.",
  },
  {
    value: "secretary",
    label: "Secretary",
    description: "Runs daily administration, member records, collections, and event operations.",
  },
  {
    value: "treasurer",
    label: "Treasurer",
    description: "Manages collections, expenses, receipts, and financial records.",
  },
  {
    value: "committee_member",
    label: "Committee Member",
    description: "Supports member and event operations without admin-level control.",
  },
  {
    value: "auditor",
    label: "Auditor",
    description: "Read-only access for reviewing collections, expenses, and society records.",
  },
]

const PERMISSIONS_BY_ROLE: Record<UserRole, Permission[]> = {
  president: [
    "view_members",
    "manage_members",
    "view_payments",
    "manage_payments",
    "view_events",
    "manage_events",
    "view_expenses",
    "manage_expenses",
    "view_society",
    "manage_society",
    "manage_users",
  ],
  secretary: [
    "view_members",
    "manage_members",
    "view_payments",
    "manage_payments",
    "view_events",
    "manage_events",
    "view_expenses",
    "manage_expenses",
    "view_society",
  ],
  treasurer: [
    "view_members",
    "view_payments",
    "manage_payments",
    "view_events",
    "view_expenses",
    "manage_expenses",
    "view_society",
  ],
  committee_member: [
    "view_members",
    "view_payments",
    "view_events",
    "manage_events",
    "view_expenses",
    "view_society",
  ],
  auditor: [
    "view_members",
    "view_payments",
    "view_events",
    "view_expenses",
    "view_society",
  ],
}

export function can(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS_BY_ROLE[role].includes(permission)
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label || role
}
