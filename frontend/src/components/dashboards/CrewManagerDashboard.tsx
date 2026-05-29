import { useState } from 'react'
import axios from 'axios'
import { Pencil, Plus, Trash2, TrendingUp, Users, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../shared/StatCard'
import StatusBadge from '../shared/StatusBadge'
import AddCrewModal from '../modals/AddCrewModal'
import EditCrewModal from '../modals/EditCrewModal'
import AddCertModal from '../modals/AddCertModal'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function CrewManagerDashboard({ data, onRefresh }: { data: any; onRefresh: () => void }) {
  const [showAddCrew, setShowAddCrew] = useState(false)
  const [certTarget, setCertTarget] = useState<{ id: number; name: string } | null>(null)
  const [editTarget, setEditTarget] = useState<any>(null)

  const utilization = data?.totalCrew
    ? Math.round(((data?.activeCrew || 0) / data.totalCrew) * 100)
    : 0

  const handleDeleteCrew = async (id: number, name: string) => {
    if (!window.confirm(`Delete "${name}" from the crew list? This cannot be undone.`)) return
    try {
      await axios.delete(`${API_URL}/api/crew/${id}`)
      onRefresh()
    } catch {
      alert('Failed to delete crew member. Please try again.')
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {showAddCrew && (
        <AddCrewModal onClose={() => setShowAddCrew(false)} onSuccess={onRefresh} />
      )}
      {editTarget && (
        <EditCrewModal crew={editTarget} onClose={() => setEditTarget(null)} onSuccess={onRefresh} />
      )}
      {certTarget && (
        <AddCertModal
          crewId={certTarget.id}
          crewName={certTarget.name}
          onClose={() => setCertTarget(null)}
          onSuccess={onRefresh}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<Users className="w-6 h-6" />} label="Active Crew" value={data?.activeCrew || 0} color="blue" />
        <StatCard icon={<Clock className="w-6 h-6" />} label="Available Pool" value={data?.availableCrew || 0} color="green" />
        <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Utilization" value={`${utilization}%`} color="purple" />
      </div>

      {data?.certificates?.length > 0 && (() => {
        const now = new Date()
        const buckets = { '0-30d': 0, '31-60d': 0, '61-90d': 0, '90d+': 0 }
        ;(data.certificates || []).forEach((c: any) => {
          const d = Math.floor((new Date(c.expiry_date).getTime() - now.getTime()) / 86400000)
          if (d <= 30 && d >= 0) buckets['0-30d']++
          else if (d <= 60) buckets['31-60d']++
          else if (d <= 90) buckets['61-90d']++
          else if (d > 90) buckets['90d+']++
        })
        const chartData = Object.entries(buckets).map(([name, value]) => ({ name, value }))
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4">Certificate Expiry Breakdown</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      })()}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Crew List</h2>
          <button type="button" onClick={() => setShowAddCrew(true)}
            className="flex items-center gap-1.5 bg-marine-600 text-white px-4 py-2 rounded-lg hover:bg-marine-700 transition text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Crew Member
          </button>
        </div>
        <p className="text-gray-500 text-sm mb-4">
          {data?.totalCrew > 0
            ? `${data.totalCrew} seafarer${data.totalCrew !== 1 ? 's' : ''} in your crew pool`
            : 'Add your first crew member to get started'}
        </p>

        {data?.crew?.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
            <Users className="w-14 h-14 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600 font-semibold text-lg mb-1">No crew members yet</p>
            <p className="text-gray-400 text-sm mb-6">
              Add your seafarers manually or re-run the demo seed to load 205 sample crew.
            </p>
            <button type="button" onClick={() => setShowAddCrew(true)}
              className="inline-flex items-center gap-2 bg-marine-600 text-white px-6 py-2.5 rounded-lg hover:bg-marine-700 transition font-medium">
              <Plus className="w-5 h-5" /> Add Your First Crew Member
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Position</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Nationality</th>
                  <th className="px-4 py-2 text-left">Certificates</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.crew.map((c: any) => {
                  const crewCerts = (data.certificates || []).filter((cert: any) => cert.crew_id === c.id)
                  const today = new Date()
                  return (
                    <tr key={c.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{c.name}</td>
                      <td className="px-4 py-2">{c.position}</td>
                      <td className="px-4 py-2"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-2">{c.nationality}</td>
                      <td className="px-4 py-2 max-w-[260px]">
                        {crewCerts.length === 0 ? (
                          <span className="text-xs text-gray-400 italic">None</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {crewCerts.map((cert: any) => {
                              const expiry = new Date(cert.expiry_date)
                              const daysLeft = Math.floor((expiry.getTime() - today.getTime()) / 86400000)
                              const dot = daysLeft < 0 ? 'bg-red-500' : daysLeft <= 90 ? 'bg-amber-400' : 'bg-green-500'
                              const certName = cert.type || 'Unknown'
                              const shortName = certName.length > 28 ? certName.slice(0, 26) + '…' : certName
                              return (
                                <span
                                  key={cert.id}
                                  title={`${certName} — expires ${cert.expiry_date}`}
                                  className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full whitespace-nowrap"
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                                  {shortName}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <button type="button" title="Add certificate"
                            onClick={() => setCertTarget({ id: c.id, name: c.name })}
                            className="inline-flex items-center gap-1 text-xs text-marine-600 border border-marine-200 hover:bg-marine-50 px-2.5 py-1 rounded-lg font-semibold transition">
                            <Plus className="w-3.5 h-3.5" /> Cert
                          </button>
                          <button type="button" title="Edit crew member"
                            onClick={() => setEditTarget({ ...c, certificates: crewCerts })}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 px-2.5 py-1 rounded-lg font-semibold transition">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button type="button" title="Delete crew member"
                            onClick={() => handleDeleteCrew(c.id, c.name)}
                            className="inline-flex items-center gap-1 text-xs text-red-600 border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-lg font-semibold transition">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
