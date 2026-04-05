"use client"

import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import {
  Cog6ToothIcon,
  UserGroupIcon,
  IdentificationIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
} from "@heroicons/react/24/outline"

interface GoverningBodyMember {
  role: string
  name: string
}

interface Config {
  name: string
  subtitle: string
  address: string
  email: string
  logo: string
  maintenanceAmount: number
  governingBody: GoverningBodyMember[]
  executiveMembers: string[]
}

type Tab = "general" | "board" | "executive"

export default function ConfigForm() {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("general")

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        setConfig(data)
        setLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load configuration")
        setLoading(false)
      })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!config) return
    const { name, value } = e.target
    setConfig({ ...config, [name]: name === "maintenanceAmount" ? Number(value) : value })
  }

  const handleGoverningChange = (index: number, field: keyof GoverningBodyMember, value: string) => {
    if (!config) return
    const newGov = [...config.governingBody]
    newGov[index] = { ...newGov[index], [field]: value }
    setConfig({ ...config, governingBody: newGov })
  }

  const removeGoverning = (index: number) => {
    if (!config) return
    const newGov = config.governingBody.filter((_, i) => i !== index)
    setConfig({ ...config, governingBody: newGov })
  }

  const handleExecChange = (index: number, value: string) => {
    if (!config) return
    const newExec = [...config.executiveMembers]
    newExec[index] = value
    setConfig({ ...config, executiveMembers: newExec })
  }

  const removeExecutive = (index: number) => {
    if (!config) return
    const newExec = config.executiveMembers.filter((_, i) => i !== index)
    setConfig({ ...config, executiveMembers: newExec })
  }

  const addGoverning = () => {
    if (!config) return
    setConfig({
      ...config,
      governingBody: [...config.governingBody, { role: "", name: "" }],
    })
  }

  const addExecutive = () => {
    if (!config) return
    setConfig({ ...config, executiveMembers: [...config.executiveMembers, ""] })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config) return
    setSaving(true)
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error("Save failed")
      toast.success("Configuration updated successfully!")
    } catch {
      toast.error("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium animate-pulse">Loading society settings...</p>
      </div>
    )
  }

  if (!config) return null

  const tabs = [
    { id: "general", label: "General Settings", icon: Cog6ToothIcon },
    { id: "board", label: "Governing Board", icon: IdentificationIcon },
    { id: "executive", label: "Executive Committee", icon: UserGroupIcon },
  ]

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 bg-slate-100/50 p-1.5 rounded-2xl w-fit">
        {tabs.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
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
        {/* General Settings */}
        {activeTab === "general" && (
          <div className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Basic Information</h2>
              <p className="text-sm text-slate-400 mt-1">Official details and contact information of the society</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <div>
                <label className="form-label">Society Name</label>
                <input
                  type="text"
                  name="name"
                  value={config.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. Swati Society HOA"
                />
              </div>
              <div>
                <label className="form-label">Subtitle / Block Details</label>
                <input
                  type="text"
                  name="subtitle"
                  value={config.subtitle}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. A & B Blocks"
                />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Registered Address</label>
                <textarea
                  name="address"
                  rows={2}
                  value={config.address}
                  onChange={handleChange}
                  className="form-input resize-none"
                  placeholder="Full official address"
                />
              </div>
              <div>
                <label className="form-label">Official Email</label>
                <input
                  type="email"
                  name="email"
                  value={config.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="society@email.com"
                />
              </div>
              <div>
                <label className="form-label">Logo Text</label>
                <input
                  type="text"
                  name="logo"
                  value={config.logo}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Annual Maintenance (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    name="maintenanceAmount"
                    value={config.maintenanceAmount}
                    onChange={handleChange}
                    className="form-input pl-8"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Governing Board */}
        {activeTab === "board" && (
          <div className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Governing Board</h2>
                <p className="text-sm text-slate-400 mt-1">Founding members and executive office bearers</p>
              </div>
              <button
                type="button"
                onClick={addGoverning}
                className="btn-secondary flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add Member
              </button>
            </div>
            <div className="space-y-4">
              {config.governingBody.map((member, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100 group">
                  <div className="flex-1">
                    <label className="form-label !mb-1 text-[10px]">Position / Role</label>
                    <input
                      type="text"
                      placeholder="e.g. President"
                      value={member.role}
                      onChange={(e) => handleGoverningChange(idx, "role", e.target.value)}
                      className="form-input !py-2 bg-white"
                    />
                  </div>
                  <div className="flex-[2]">
                    <label className="form-label !mb-1 text-[10px]">Member Name</label>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={member.name}
                      onChange={(e) => handleGoverningChange(idx, "name", e.target.value)}
                      className="form-input !py-2 bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGoverning(idx)}
                    className="sm:mt-6 p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Executive Committee */}
        {activeTab === "executive" && (
          <div className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Executive Committee</h2>
                <p className="text-sm text-slate-400 mt-1">Supporting executive board members</p>
              </div>
              <button
                type="button"
                onClick={addExecutive}
                className="btn-secondary flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add Member
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.executiveMembers.map((member, idx) => (
                <div key={idx} className="relative group">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={member}
                    onChange={(e) => handleExecChange(idx, e.target.value)}
                    className="form-input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => removeExecutive(idx)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Floating Save Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary !px-8 !py-4 flex items-center gap-3 shadow-2xl"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving Changes...
              </>
            ) : (
              <>
                <CheckIcon className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
