import { useState } from 'react'
import { AlertCircle, FileText, Pencil, Trash2, X } from 'lucide-react'
import { NATIONALITIES, POSITIONS, STATUSES, CERT_TYPES } from '../../constants/maritime'
import { api } from '../../lib/api'
import type { Certificate } from '../../types'

interface EditCrewModalProps {
  crew: {
    id: number
    name: string
    position: string
    status: string
    nationality: string
    certificates?: Certificate[]
  }
  onClose: () => void
  onSuccess: () => void
}

export default function EditCrewModal({ crew, onClose, onSuccess }: EditCrewModalProps) {
  const [form, setForm] = useState({
    name: crew.name,
    position: crew.position,
    status: crew.status,
    nationality: crew.nationality,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [certs, setCerts] = useState<Certificate[]>(crew.certificates || [])
  const [editingCertId, setEditingCertId] = useState<number | null>(null)
  const [certForm, setCertForm] = useState<any>({})
  const [certSaving, setCertSaving] = useState(false)
  const [certError, setCertError] = useState<string | null>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await api.put(`/api/crew/${crew.id}`, {
        name: form.name.trim(),
        position: form.position,
        status: form.status,
        nationality: form.nationality,
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update crew member.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEditCert = (cert: Certificate) => {
    setEditingCertId(cert.id)
    setCertForm({
      certificate_type: cert.type,
      issue_date: cert.issue_date,
      expiry_date: cert.expiry_date,
      issuing_authority: cert.authority,
    })
    setCertError(null)
  }

  const saveCert = async (certId: number) => {
    setCertSaving(true)
    setCertError(null)
    try {
      await api.put(`/api/certificates/${certId}`, certForm)
      setCerts(prev => prev.map(c => c.id === certId ? {
        ...c,
        type: certForm.certificate_type,
        issue_date: certForm.issue_date,
        expiry_date: certForm.expiry_date,
        authority: certForm.issuing_authority,
      } : c))
      setEditingCertId(null)
      onSuccess()
    } catch (err: any) {
      setCertError(err.response?.data?.detail || 'Failed to update certificate.')
    } finally {
      setCertSaving(false)
    }
  }

  const deleteCert = async (certId: number, certType: string) => {
    if (!window.confirm(`Delete "${certType}"? This cannot be undone.`)) return
    try {
      await api.delete(`/api/certificates/${certId}`)
      setCerts(prev => prev.filter(c => c.id !== certId))
      onSuccess()
    } catch {
      alert('Failed to delete certificate. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <button type="button" onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-marine-600" /> Edit Crew Member
            </h2>
            <form id="crew-edit-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input required type="text" value={form.name} onChange={e => set('name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position / Rank</label>
                  <select value={form.position} onChange={e => set('position', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm bg-white">
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm bg-white">
                    {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                  <select value={form.nationality} onChange={e => set('nationality', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm bg-white">
                    {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}
            </form>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-gray-400" /> Certificates
            </h3>
            {certs.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No certificates added yet.</p>
            ) : (
              <div className="space-y-2">
                {certs.map(cert => (
                  <div key={cert.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {editingCertId === cert.id ? (
                      <div className="p-3 space-y-2 bg-gray-50">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Certificate Type</label>
                          <select value={certForm.certificate_type}
                            onChange={e => setCertForm((f: any) => ({ ...f, certificate_type: e.target.value }))}
                            className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-marine-600">
                            {CERT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Issue Date</label>
                            <input type="date" value={certForm.issue_date}
                              onChange={e => setCertForm((f: any) => ({ ...f, issue_date: e.target.value }))}
                              className="w-full px-2 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-marine-600" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Expiry Date</label>
                            <input type="date" value={certForm.expiry_date}
                              onChange={e => setCertForm((f: any) => ({ ...f, expiry_date: e.target.value }))}
                              className="w-full px-2 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-marine-600" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Issuing Authority</label>
                          <input type="text" value={certForm.issuing_authority}
                            onChange={e => setCertForm((f: any) => ({ ...f, issuing_authority: e.target.value }))}
                            className="w-full px-2 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-marine-600" />
                        </div>
                        {certError && (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />{certError}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setEditingCertId(null)}
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition">
                            Cancel
                          </button>
                          <button type="button" disabled={certSaving} onClick={() => saveCert(cert.id)}
                            className="flex-1 px-3 py-1.5 bg-marine-600 text-white rounded-lg text-xs hover:bg-marine-700 disabled:opacity-50 transition">
                            {certSaving ? 'Saving…' : 'Save Certificate'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate" title={cert.type}>{cert.type}</p>
                          <p className="text-xs text-gray-400">Expires: {cert.expiry_date}</p>
                        </div>
                        <div className="flex gap-1.5 ml-3 flex-shrink-0">
                          <button type="button" onClick={() => startEditCert(cert)}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 px-2 py-1 rounded-lg transition">
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                          <button type="button" onClick={() => deleteCert(cert.id, cert.type)}
                            className="inline-flex items-center gap-1 text-xs text-red-600 border border-red-200 hover:bg-red-50 px-2 py-1 rounded-lg transition">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition">
            Cancel
          </button>
          <button type="submit" form="crew-edit-form" disabled={submitting}
            className="flex-1 px-4 py-2 bg-marine-600 text-white rounded-lg hover:bg-marine-700 disabled:opacity-50 text-sm font-medium transition">
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
