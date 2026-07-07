import { AlertCircle, CheckCircle, Ship } from 'lucide-react'
import StatCard from '../shared/StatCard'
import StatusBadge from '../shared/StatusBadge'
import type { DashboardData } from '../../types'

export default function MasterDashboard({ data }: { data: DashboardData }) {
  const onboardCrew = data.crew.filter(c => c.status === 'onboard')

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-marine-900 mb-1">Master Dashboard</h1>
        <p className="text-gray-500 text-sm">Vessel command overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard icon={<Ship className="w-6 h-6" />} label="Onboard Crew" value={data.activeCrew} color="blue" />
        <StatCard icon={<CheckCircle className="w-6 h-6" />} label="Compliance Status" value="Good" color="green" />
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold mb-4">Current Crew Manifest</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Name</th>
                <th className="px-4 py-2.5 text-left font-semibold">Position</th>
                <th className="px-4 py-2.5 text-left font-semibold">Nationality</th>
                <th className="px-4 py-2.5 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {onboardCrew.map(c => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{c.name}</td>
                  <td className="px-4 py-2">{c.position}</td>
                  <td className="px-4 py-2">{c.nationality}</td>
                  <td className="px-4 py-2"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
              {onboardCrew.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">No crew currently onboard</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data.alerts.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-4">Active Alerts</h2>
          <div className="space-y-2">
            {data.alerts.map((a, i) => (
              <div key={i} className={`flex items-center p-3 rounded-lg ${a.severity === 'high' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <AlertCircle className={`w-5 h-5 mr-2 flex-shrink-0 ${a.severity === 'high' ? 'text-red-600' : 'text-yellow-600'}`} />
                <span className="text-sm">{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
