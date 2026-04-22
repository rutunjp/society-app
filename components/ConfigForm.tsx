"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "react-hot-toast"
import {
  CheckIcon,
  Cog6ToothIcon,
  IdentificationIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline"
import { useSociety } from "@/components/Providers"
import { getRoleLabel, ROLE_OPTIONS } from "@/lib/rbac"
import { AppUser, GoverningBodyMember, SocietySummary, UserRole } from "@/types"

type Tab = "general" | "board" | "executive" | "access"

const EMPTY_INVITE_FORM = {
  name: "",
  email: "",
  role: "secretary" as UserRole,
}

export default function ConfigForm() {
  const {
    activeSociety,
    currentUser,
    hasPermission,
    loading,
    refreshAppContext,
  } = useSociety()
  const [config, setConfig] = useState<SocietySummary | null>(null)
  const [users, setUsers] = useState<AppUser[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [inviteForm, setInviteForm] = useState(EMPTY_INVITE_FORM)
  const [submittingInvite, setSubmittingInvite] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("general")

  const canManageSociety = hasPermission("manage_society")
  const canManageUsers = hasPermission("manage_users")

  useEffect(() => {
    if (activeSociety) {
      setConfig(activeSociety)
    }
  }, [activeSociety])

  const fetchUsers = useCallback(async () => {
    if (!canManageUsers) return

    setLoadingUsers(true)
    try {
      const res = await fetch("/api/users")
      const payload = await res.json()
      if (payload.success) {
        setUsers(payload.data)
      }
    } finally {
      setLoadingUsers(false)
    }
  }, [canManageUsers])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers, activeSociety?.id])

  const tabs = useMemo(
    () =>
      [
        { id: "general", label: "General Settings", icon: Cog6ToothIcon },
        { id: "board", label: "Governing Board", icon: IdentificationIcon },
        { id: "executive", label: "Executive Committee", icon: UserGroupIcon },
        canManageUsers ? { id: "access", label: "Access Control", icon: UserGroupIcon } : null,
      ].filter(Boolean) as { id: Tab; label: string; icon: typeof Cog6ToothIcon }[],
    [canManageUsers]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!config) return
    const { name, value } = e.target
    setConfig({ ...config, [name]: name === "maintenanceAmount" ? Number(value) : value })
  }

  const handleGoverningChange = (index: number, field: keyof GoverningBodyMember, value: string) => {
    if (!config) return
    const governingBody = [...config.governingBody]
    governingBody[index] = { ...governingBody[index], [field]: value }
    setConfig({ ...config, governingBody })
  }

  const handleExecChange = (index: number, value: string) => {
    if (!config) return
    const executiveMembers = [...config.executiveMembers]
    executiveMembers[index] = value
    setConfig({ ...config, executiveMembers })
  }

  const addGoverning = () => {
    if (!config || !canManageSociety) return
    setConfig({
      ...config,
      governingBody: [...config.governingBody, { role: "", name: "" }],
    })
  }

  const addExecutive = () => {
    if (!config || !canManageSociety) return
    setConfig({
      ...config,
      executiveMembers: [...config.executiveMembers, ""],
    })
  }

  const removeGoverning = (index: number) => {
    if (!config || !canManageSociety) return
    setConfig({
      ...config,
      governingBody: config.governingBody.filter((_, itemIndex) => itemIndex !== index),
    })
  }

  const removeExecutive = (index: number) => {
    if (!config || !canManageSociety) return
    setConfig({
      ...config,
      executiveMembers: config.executiveMembers.filter((_, itemIndex) => itemIndex !== index),
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!config || !canManageSociety) return

    setSaving(true)
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      const payload = await res.json()
      if (!payload.success) throw new Error(payload.error || "Save failed")

      await refreshAppContext()
      toast.success("Society configuration updated successfully!")
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save changes"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleInviteSubmit() {
    if (!canManageUsers) return
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      toast.error("Name and email are required")
      return
    }

    setSubmittingInvite(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      })
      const payload = await res.json()
      if (!payload.success) throw new Error(payload.error || "Failed to invite user")

      setInviteForm(EMPTY_INVITE_FORM)
      await fetchUsers()
      toast.success("User added. They can sign in with the invited Google email.")
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to invite user"
      toast.error(message)
    } finally {
      setSubmittingInvite(false)
    }
  }

  async function handleUserUpdate(user: AppUser, nextValues: { name: string; role: UserRole }) {
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: user.id,
        name: nextValues.name,
        role: nextValues.role,
      }),
    })
    const payload = await res.json()
    if (!payload.success) {
      toast.error(payload.error || "Failed to update user")
      return
    }

    setUsers((currentUsers) =>
      currentUsers.map((currentUser) =>
        currentUser.id === user.id ? payload.data : currentUser
      )
    )
    toast.success("User role updated")
  }

  async function handleUserDelete(userId: string) {
    const res = await fetch(`/api/users?id=${userId}`, { method: "DELETE" })
    const payload = await res.json()
    if (!payload.success) {
      toast.error(payload.error || "Failed to remove user")
      return
    }

    setUsers((currentUsers) => currentUsers.filter((user) => user.id !== userId))
    toast.success("User access removed")
  }

  if (loading && !config) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium animate-pulse">Loading society settings...</p>
      </div>
    )
  }

  if (!config) return null

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          Current Society
        </p>
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{config.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {currentUser ? `${getRoleLabel(currentUser.role)} access for ${currentUser.name}` : config.email}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            One account belongs to one society. Invite colleagues from the Access Control tab.
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-slate-100/50 p-1.5 rounded-2xl w-fit">
        {tabs.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                active
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${active ? "text-indigo-600" : "text-slate-400"}`} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {activeTab === "general" && (
          <div className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Basic Information</h2>
              <p className="text-sm text-slate-400 mt-1">Official details and contact information for your society</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <div>
                <label className="form-label">Society Name</label>
                <input disabled={!canManageSociety} type="text" name="name" value={config.name} onChange={handleChange} className="form-input disabled:bg-slate-100" />
              </div>
              <div>
                <label className="form-label">Subtitle / Block Details</label>
                <input disabled={!canManageSociety} type="text" name="subtitle" value={config.subtitle} onChange={handleChange} className="form-input disabled:bg-slate-100" />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Registered Address</label>
                <textarea disabled={!canManageSociety} name="address" rows={2} value={config.address} onChange={handleChange} className="form-input resize-none disabled:bg-slate-100" />
              </div>
              <div>
                <label className="form-label">Official Email</label>
                <input disabled={!canManageSociety} type="email" name="email" value={config.email} onChange={handleChange} className="form-input disabled:bg-slate-100" />
              </div>
              <div>
                <label className="form-label">Logo Text</label>
                <input disabled={!canManageSociety} type="text" name="logo" value={config.logo} onChange={handleChange} className="form-input disabled:bg-slate-100" />
              </div>
              <div>
                <label className="form-label">Annual Maintenance (₹)</label>
                <input disabled={!canManageSociety} type="number" name="maintenanceAmount" value={config.maintenanceAmount} onChange={handleChange} className="form-input disabled:bg-slate-100" />
              </div>
            </div>
          </div>
        )}

        {activeTab === "board" && (
          <div className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Governing Board</h2>
                <p className="text-sm text-slate-400 mt-1">Office bearers for this society</p>
              </div>
              {canManageSociety && (
                <button type="button" onClick={addGoverning} className="btn-secondary flex items-center gap-2">
                  <PlusIcon className="w-4 h-4" />
                  Add Member
                </button>
              )}
            </div>
            <div className="space-y-4">
              {config.governingBody.map((member, index) => (
                <div key={`${member.role}-${index}`} className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  <input
                    disabled={!canManageSociety}
                    type="text"
                    placeholder="Role"
                    value={member.role}
                    onChange={(e) => handleGoverningChange(index, "role", e.target.value)}
                    className="form-input flex-1 disabled:bg-slate-100"
                  />
                  <input
                    disabled={!canManageSociety}
                    type="text"
                    placeholder="Name"
                    value={member.name}
                    onChange={(e) => handleGoverningChange(index, "name", e.target.value)}
                    className="form-input flex-1 disabled:bg-slate-100"
                  />
                  {canManageSociety && (
                    <button type="button" onClick={() => removeGoverning(index)} className="btn-secondary px-3">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "executive" && (
          <div className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Executive Committee</h2>
                <p className="text-sm text-slate-400 mt-1">Supporting committee members for this society</p>
              </div>
              {canManageSociety && (
                <button type="button" onClick={addExecutive} className="btn-secondary flex items-center gap-2">
                  <PlusIcon className="w-4 h-4" />
                  Add Member
                </button>
              )}
            </div>
            <div className="space-y-4">
              {config.executiveMembers.map((member, index) => (
                <div key={`${member}-${index}`} className="flex gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  <input
                    disabled={!canManageSociety}
                    type="text"
                    placeholder="Committee member name"
                    value={member}
                    onChange={(e) => handleExecChange(index, e.target.value)}
                    className="form-input flex-1 disabled:bg-slate-100"
                  />
                  {canManageSociety && (
                    <button type="button" onClick={() => removeExecutive(index)} className="btn-secondary px-3">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "access" && canManageUsers && (
          <div className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Access Control</h2>
              <p className="text-sm text-slate-400 mt-1">
                Invite Google accounts into this society and assign a role suited to their office.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-[1.1fr_1.2fr_1fr_auto]">
              <input
                required
                type="text"
                placeholder="Full name"
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                className="form-input"
              />
              <input
                required
                type="email"
                placeholder="Google email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                className="form-input"
              />
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as UserRole })}
                className="form-input"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleInviteSubmit}
                disabled={submittingInvite}
                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {submittingInvite ? "Adding..." : "Add User"}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {ROLE_OPTIONS.map((role) => (
                <div key={role.value} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{role.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{role.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              {loadingUsers ? (
                <p className="text-sm text-slate-400">Loading users...</p>
              ) : users.length === 0 ? (
                <p className="text-sm text-slate-400">No additional users added yet.</p>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      isSelf={user.id === currentUser?.id}
                      onSave={handleUserUpdate}
                      onDelete={handleUserDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {canManageSociety && activeTab !== "access" && (
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2">
              <CheckIcon className="w-4 h-4" />
              {saving ? "Saving..." : "Save Society Settings"}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

function UserRow({
  user,
  isSelf,
  onSave,
  onDelete,
}: {
  user: AppUser
  isSelf: boolean
  onSave: (user: AppUser, nextValues: { name: string; role: UserRole }) => Promise<void>
  onDelete: (userId: string) => Promise<void>
}) {
  const [name, setName] = useState(user.name)
  const [role, setRole] = useState<UserRole>(user.role)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(user.name)
    setRole(user.role)
  }, [user.name, user.role])

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(user, { name, role })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-[1.2fr_1.3fr_1fr_auto_auto]">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="form-input"
      />
      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
        {user.email}
      </div>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as UserRole)}
        className="form-input"
      >
        {ROLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save"}
      </button>
      <button
        type="button"
        onClick={() => onDelete(user.id)}
        disabled={isSelf}
        className="rounded-xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Remove
      </button>
      <div className="md:col-span-5 flex items-center justify-between text-xs text-slate-500">
        <span>{getRoleLabel(user.role)}</span>
        <span>{user.status === "active" ? "Active" : "Invited - activates on first Google sign-in"}</span>
      </div>
    </div>
  )
}
