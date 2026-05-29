import { useState, useEffect } from 'react'
import axios from 'axios'
import { AlertCircle, Plus, Pencil, Trash2, Ship, Users, X, Anchor } from 'lucide-react'
import StatCard from '../shared/StatCard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const VESSEL_TYPES = ['Bulk Carrier', 'Container Ship', 'Tanker', 'General Cargo', 'RoRo', 'Passenger', 'Offshore', 'Tug', 'Other']
const FLAG_STATES = ['Panama', 'Liberia', 'Marshall Islands', 'Hong Kong', 'Singapore', 'Bahamas', 'Malta', 'Cyprus', 'UK', 'Norway', 'Other']

interface Vessel {
  id: number
  name: string
  imo: string
  type: string
  flag: string
  status: string
  crew_count: number
}

export default function VesselDashboard({ crewList }: { crewList: any[] }) {
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState<Vessel | null>(null)
  const [assignTarget, setAssignTarget] = useState<Vessel | null>(null)

  const loadVessels = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/vessels/`)
      setVessels(res.data.vessels || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadVessels() }, [])

  const deleteVessel = async (id: number, name: string) => {
    if (!window.confirm(`Delete vessel "${name}"? This cannot be undone.`)) return
    try {
      await axios.delete(`${API_URL}/api/vessels/${id}`)
      loadVessels()
    } catch {
      alert('Failed to delete vessel.')
    }
  }

  const totalCrew = vessels.reduce((sum, v) => sum + v.crew_count, 0)
  const activeVessels = vessels.filter(v => v.status === 'active').length

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {showAdd && <VesselModal onClose={() => setShowAdd(false)} onSuccess={loadVessels} />}
      {editTarget && <VesselModal vessel={editTarget} onClose={() => setEditTarget(null)} onSuccess={loadVessels} />}
      {assignTarget && (
        <AssignCrewModal vessel={assignTarget} crewList={crewList} onClose={() => setAssignTarget(null)} onSuccess={loadVessels} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<Ship className="w-6 h-6" />} label="Total Vessels" value={vessels.length} color="blue" />
        <StatCard icon={<Anchor className="w-6 h-6" />} label="Active Vessels" value={activeVessels} color="green" />
        <StatCard icon={<Users className="w-6 h-6" />} label="Crew Deployed" value={totalCrew} color="purple" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Fleet Registry</h2>
          <button type="button" onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-marine-600 text-white px-4 py-2 rounded-lg hover:bg-marine-700 transition text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Vessel
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-marine-600" />
          </div>
        ) : vessels.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
            <Ship className="w-14 h-14 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600 font-semibold text-lg mb-1">No vessels registered</p>
            <button type="button" onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 bg-marine-600 text-white px-6 py-2.5 rounded-lg hover:bg-marine-700 transition font-medium mt-4">
              <Plus className="w-5 h-5" /> Add Your First Vessel
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Vessel Name</th>
                  <th className="px-4 py-2 text-left">IMO</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Flag State</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Crew</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vessels.map(v => (
                  <tr key={v.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{v.name}</td>
                    <td className="px-4 py-2 text-gray-500 font-mono text-xs">{v.imo}</td>
                    <td className="px-4 py-2">{v.type}</td>
                    <td className="px-4 py-2">{v.flag}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${v.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{v.crew_count}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => setAssignTarget(v)}
                          className="inline-flex items-center gap-1 text-xs text-marine-600 border border-marine-200 hover:bg-marine-50 px-2.5 py-1 rounded-lg font-semibold transition">
                          <Users className="w-3.5 h-3.5" /> Assign
                        </button>
                        <button type="button" onClick={() => setEditTarget(v)}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 px-2.5 py-1 rounded-lg font-semibold transition">
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button type="button" onClick={() => deleteVessel(v.id, v.name)}
                          className="inline-flex items-center gap-1 text-xs text-red-600 border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-lg font-semibold transition">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function VesselModal({ vessel, onClose, onSuccess }: {
  vessel?: Vessel
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState({
    name: vessel?.name || '',
    imo: vessel?.imo || '',
    vessel_type: vessel?.type || VESSEL_TYPES[0],
    flag_state: vessel?.flag || FLAG_STATES[0],
    status: vessel?.status || 'active',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (vessel) {
        await axios.put(`${API_URL}/api/vessels/${vessel.id}`, {
          name: form.name,
          vessel_type: form.vessel_type,
          flag_state: form.flag_state,
          status: form.status,
        })
      } else {
        await axios.post(`${API_URL}/api/vessels/`, form)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save vessel.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative" onClick={e => e.stopPropagation()}>
        <button type="button" onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
          <Ship className="w-5 h-5 text-marine-600" /> {vessel ? 'Edit Vessel' : 'Add Vessel'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Vessel Name *</label>
              <input required type="text" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. MV Ocean Star"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm" />
            </div>
            {!vessel && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IMO Number *</label>
                <input required type="text" value={form.imo} onChange={e => set('imo', e.target.value)}
                  placeholder="e.g. IMO9123456"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vessel Type</label>
              <select value={form.vessel_type} onChange={e => set('vessel_type', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm bg-white">
                {VESSEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Flag State</label>
              <select value={form.flag_state} onChange={e => set('flag_state', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm bg-white">
                {FLAG_STATES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            {vessel && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm bg-white">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            )}
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
              {submitting ? 'Saving…' : (vessel ? 'Save Changes' : 'Add Vessel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AssignCrewModal({ vessel, crewList, onClose, onSuccess }: {
  vessel: Vessel
  crewList: any[]
  onClose: () => void
  onSuccess: () => void
}) {
  const availableCrew = crewList.filter(c => c.status === 'available')
  const [crewId, setCrewId] = useState(availableCrew[0]?.id?.toString() || '')
  const [position, setPosition] = useState('Master')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!crewId) return
    setSubmitting(true)
    setError(null)
    try {
      await axios.post(`${API_URL}/api/assignments/`, {
        crew_id: parseInt(crewId),
        vessel_id: vessel.id,
        position,
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to assign crew.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
        <button type="button" onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Users className="w-5 h-5 text-marine-600" /> Assign Crew to {vessel.name}
        </h2>
        {availableCrew.length === 0 ? (
          <p className="text-gray-500 text-sm mt-4">No available crew in the pool. Change crew status to "available" in Crew Manager first.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Crew Member</label>
              <select value={crewId} onChange={e => setCrewId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm bg-white">
                {availableCrew.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.position} ({c.nationality})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Onboard Position</label>
              <input type="text" value={position} onChange={e => setPosition(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm" />
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
                {submitting ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
