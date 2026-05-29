import { useState } from 'react'
import axios from 'axios'
import { AlertCircle, Users } from 'lucide-react'
import ModalOverlay from '../shared/ModalOverlay'
import { NATIONALITIES, POSITIONS } from '../../constants/maritime'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AddCrewModal({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState({
    name: '', employee_id: '', nationality: 'Filipino',
    position: 'Master', email: '', phone: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await axios.post(`${API_URL}/api/crew/`, {
        name: form.name.trim(),
        employee_id: form.employee_id.trim() || null,
        nationality: form.nationality,
        position: form.position,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add crew member. Check the Employee ID is unique.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
        <Users className="w-5 h-5 text-marine-600" /> Add Crew Member
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input required type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. James Smith"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee ID / Contract No. <span className="text-gray-400">(optional)</span>
            </label>
            <input type="text" value={form.employee_id} onChange={e => set('employee_id', e.target.value)}
              placeholder="e.g. EMP0001 or CTR-2024-01"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
            <select value={form.nationality} onChange={e => set('nationality', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm bg-white">
              {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position / Rank</label>
            <select value={form.position} onChange={e => set('position', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm bg-white">
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400">(optional)</span></label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="crew@company.com"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-gray-400">(optional)</span></label>
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="+1 234 567 8900"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm" />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="flex-1 px-4 py-2 bg-marine-600 text-white rounded-lg hover:bg-marine-700 disabled:opacity-50 text-sm font-medium transition">
            {submitting ? 'Adding…' : 'Add Crew Member'}
          </button>
        </div>
      </form>
    </ModalOverlay>
  )
}
