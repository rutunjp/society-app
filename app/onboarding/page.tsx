"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSociety } from "@/components/Providers"
import { toast } from "react-hot-toast"

const EMPTY_FORM = {
  name: "",
  subtitle: "",
  address: "",
  email: "",
  logo: "",
  maintenanceAmount: "",
}

export default function OnboardingPage() {
  const router = useRouter()
  const { needsOnboarding, refreshAppContext, sessionUser } = useSociety()
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          maintenanceAmount: Number(form.maintenanceAmount || 0),
        }),
      })
      const payload = await res.json()
      if (!payload.success) {
        throw new Error(payload.error || "Failed to create society")
      }

      await refreshAppContext()
      toast.success("Society created. You are now the President / Chairperson.")
      router.replace("/dashboard")
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create society"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (!needsOnboarding) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">
            First-Time Setup
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">
            Create Your Society Workspace
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            This Google account is not linked to any society yet. Create your society once and you
            will become the initial President / Chairperson who can invite other users.
          </p>
          {sessionUser?.email && (
            <p className="mt-2 text-xs font-medium text-slate-400">
              Signed in as {sessionUser.email}
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="form-label">Society Name</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="form-input"
                  placeholder="Shanti Heights CHS"
                />
              </div>
              <div>
                <label className="form-label">Blocks / Wing Details</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="form-input"
                  placeholder="A, B, C Wings"
                />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Registered Address</label>
                <textarea
                  required
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="form-input resize-none"
                  placeholder="Full society address"
                />
              </div>
              <div>
                <label className="form-label">Official Society Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="form-input"
                  placeholder="office@society.com"
                />
              </div>
              <div>
                <label className="form-label">Logo Text</label>
                <input
                  type="text"
                  value={form.logo}
                  onChange={(e) => setForm({ ...form, logo: e.target.value })}
                  className="form-input"
                  placeholder="SHANTI"
                />
              </div>
              <div>
                <label className="form-label">Annual Maintenance (Optional)</label>
                <input
                  type="number"
                  min={0}
                  value={form.maintenanceAmount}
                  onChange={(e) => setForm({ ...form, maintenanceAmount: e.target.value })}
                  className="form-input"
                  placeholder="15000"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
              The first user is created automatically with the role{" "}
              <span className="font-semibold text-slate-900">President / Chairperson</span>. You can
              invite the Secretary, Treasurer, Committee Members, and Auditor later from
              Configuration.
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Creating society..." : "Create Society And Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
