import { useState } from 'react'
import { AlertCircle, CheckCircle, Clock, Plus, Ship, Users } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import StatCard from '../shared/StatCard'
import StatusBadge from '../shared/StatusBadge'
import AddCrewModal from '../modals/AddCrewModal'

export default function SuperAdminDashboard({ data, onRefresh }: { data: any; onRefresh: () => void }) {
  const [showAddCrew, setShowAddCrew] = useState(false)

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {showAddCrew && (
        <AddCrewModal onClose={() => setShowAddCrew(false)} onSuccess={onRefresh} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-6 h-6" />} label="Total Crew" value={data?.totalCrew || 0} color="blue" />
        <StatCard icon={<Ship className="w-6 h-6" />} label="Active Crew" value={data?.activeCrew || 0} color="green" />
        <StatCard icon={<Clock className="w-6 h-6" />} label="Expiring Certs (90d)" value={data?.expiringCerts || 0} color="orange" />
        <StatCard icon={<CheckCircle className="w-6 h-6" />} label="Compliance Rate"
          value={data?.totalCrew > 0 ? `${Math.max(0, Math.round((1 - data.expiringCerts / Math.max(data.totalCerts, 1)) * 100))}%` : '—'}
          color="green" />
      </div>

      {data?.totalCrew > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">Crew Status Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Available', value: data?.availableCrew || 0 },
                  { name: 'Onboard', value: data?.activeCrew || 0 },
                  { name: 'Leave', value: (data?.crew || []).filter((c: any) => c.status === 'leave').length },
                  { name: 'Inactive', value: (data?.crew || []).filter((c: any) => c.status === 'inactive').length },
                ].filter(d => d.value > 0)}
                cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {['#22c55e', '#3b82f6', '#f59e0b', '#6b7280'].map((color, i) => (
                  <Cell key={i} fill={color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">Crew by Status</h2>
          {data?.totalCrew === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No crew yet — switch to Crew Manager to add your first seafarer.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Available</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">{data?.availableCrew || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Onboard</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">{data?.activeCrew || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Open Alerts</span>
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-semibold">{data?.totalAlerts || 0}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">Alerts &amp; Issues</h2>
          <div className="space-y-2">
            {data?.alerts?.slice(0, 4).map((a: any, i: number) => (
              <div key={i} className="flex items-center p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
                <span className="text-red-700 text-sm">{a.message}</span>
              </div>
            ))}
            {(!data?.alerts || data.alerts.length === 0) && (
              <p className="text-gray-500 text-sm">No active alerts</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Recent Crew</h2>
          <button type="button" onClick={() => setShowAddCrew(true)}
            className="flex items-center gap-1.5 bg-marine-600 text-white px-4 py-2 rounded-lg hover:bg-marine-700 transition text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Crew Member
          </button>
        </div>
        {data?.crew?.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium mb-1">No crew members yet</p>
            <p className="text-gray-400 text-sm mb-4">Click "Add Crew Member" to get started</p>
            <button type="button" onClick={() => setShowAddCrew(true)}
              className="inline-flex items-center gap-1.5 bg-marine-600 text-white px-5 py-2 rounded-lg hover:bg-marine-700 transition text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Your First Crew Member
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
                </tr>
              </thead>
              <tbody>
                {data.crew.slice(0, 5).map((c: any) => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{c.name}</td>
                    <td className="px-4 py-2">{c.position}</td>
                    <td className="px-4 py-2"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-2">{c.nationality}</td>
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
