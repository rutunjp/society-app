"use client"
import { useEffect, useState, useRef } from "react"
import Papa from "papaparse"
import Nav from "@/components/Nav"
import Modal from "@/components/Modal"
import ConfirmDialog from "@/components/ConfirmDialog"
import PageHeader from "@/components/PageHeader"
import LoadingSpinner from "@/components/LoadingSpinner"
import { TrashIcon, PencilSquareIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { Member } from "@/types"
import { toast } from "react-hot-toast"

const EMPTY_FORM = { name: "", flat_no: "", phone: "", email: "", type: "owner" }

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [editingMember, setEditingMember] = useState<Member | null>(null)

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchMembers() {
    setLoading(true)
    const res = await fetch("/api/members")
    const data = await res.json()
    if (data.success) setMembers(data.data)
    setLoading(false)
  }

  useEffect(() => { fetchMembers() }, [])

  function openModal() {
    setEditingMember(null)
    setForm({ ...EMPTY_FORM })
    setError("")
    setModalOpen(true)
  }

  function openEditModal(member: Member) {
    setEditingMember(member)
    setForm({
      name: member.name,
      flat_no: member.flat_no,
      phone: member.phone,
      email: member.email || "",
      type: member.type
    })
    setError("")
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const url = editingMember ? `/api/members?id=${editingMember.id}` : "/api/members"
      const method = editingMember ? "PUT" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setModalOpen(false)
        fetchMembers()
        toast.success(editingMember ? "Member updated successfully!" : "Member added securely!")
      } else {
        setError(data.error || "Failed to save member")
        toast.error(data.error || "Failed to save member")
      }
    } catch {
      setError("Network error")
      toast.error("Network error")
    } finally {
      setSubmitting(false)
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    toast.loading("Processing CSV...", { id: "csv-upload" })
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await fetch("/api/members/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ members: results.data }),
          })
          const data = await res.json()
          if (data.success) {
            fetchMembers()
            toast.success("Bulk members imported successfully!", { id: "csv-upload" })
          } else {
            toast.error(data.error || "Failed to import members", { id: "csv-upload" })
          }
        } catch {
          toast.error("Network error during import", { id: "csv-upload" })
        }
        if (fileInputRef.current) fileInputRef.current.value = ""
      },
      error: (err: Error) => {
        toast.error(`CSV Parsing error: ${err.message}`, { id: "csv-upload" })
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    })
  }

  function confirmDelete(id: string) {
    setDeleteId(id)
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/members?id=${deleteId}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        fetchMembers()
        toast.success("Member removed from registry")
      } else {
        toast.error(data.error || "Failed to delete")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Nav />
      <main className="flex-1 p-4 md:p-8 overflow-hidden items-stretch">
        <PageHeader
          title="Members"
          subtitle={`${members.length} registered members`}
          action={
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="all">All Types</option>
                <option value="owner">Owners</option>
                <option value="tenant">Tenants</option>
              </select>
              <div className="flex gap-2">
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex-1 md:flex-none"
                  title="Expects CSV with headers: name, flat_no, phone, email, type"
                >
                  Import CSV
                </button>
                <button
                  onClick={openModal}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex-1 md:flex-none"
                >
                  + Add Member
                </button>
              </div>
            </div>
          }
        />

        {loading ? (
          <LoadingSpinner />
        ) : members.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No members yet</p>
            <p className="text-sm mt-1">Add your first member to get started</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Flat No</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members
                  .filter(m => {
                    const matchesSearch = 
                      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      m.flat_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      m.phone.includes(searchQuery);
                    const matchesType = filterType === "all" || m.type === filterType;
                    return matchesSearch && matchesType;
                  })
                  .map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-indigo-700">{m.flat_no}</td>
                      <td className="px-4 py-3 text-gray-900">{m.name}</td>
                      <td className="px-4 py-3 text-gray-600">{m.phone}</td>
                      <td className="px-4 py-3 text-gray-600">{m.email || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.type === "owner"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(m)} 
                            className="text-indigo-600 hover:text-indigo-800 transition" 
                            aria-label="Edit"
                          >
                            <PencilSquareIcon className="w-5 h-5 inline-block" />
                          </button>
                          <button 
                            onClick={() => confirmDelete(m.id)} 
                            className="text-red-500 hover:text-red-700 transition" 
                            aria-label="Delete"
                          >
                            <TrashIcon className="w-5 h-5 inline-block" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        <Modal title={editingMember ? "Edit Member" : "Add Member"} open={modalOpen} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Full Name", key: "name", type: "text", placeholder: "Rahul Sharma" },
              { label: "Flat No", key: "flat_no", type: "text", placeholder: "A-101" },
              { label: "Phone", key: "phone", type: "tel", placeholder: "9876543210" },
              { label: "Email", key: "email", type: "email", placeholder: "rahul@email.com" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required={key !== "email"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="owner">Owner</option>
                <option value="tenant">Tenant</option>
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? (editingMember ? "Updating..." : "Adding...") : (editingMember ? "Update Member" : "Add Member")}
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={!!deleteId}
          title="Delete Member"
          message="Are you sure you want to delete this member? All associated records will be lost."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleting}
        />
      </main>
    </div>
  )
}
