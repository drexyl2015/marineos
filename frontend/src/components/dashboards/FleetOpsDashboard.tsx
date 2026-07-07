import { Activity, AlertCircle, BarChart2, Ship, UserCheck, Users } from 'lucide-react'
import StatCard from '../shared/StatCard'
import StatusBadge from '../shared/StatusBadge'
import type { DashboardData } from '../../types'

export default function FleetOpsDashboard({ data }: { data: DashboardData }) {
  const positions = [...new Set(data.crew.map(c => c.position))]
  const nationalities = [...new Set(data.crew.map(c => c.nationality))]

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-6 h-6" />} label="Total Fleet Crew" value={data.totalCrew} color="blue" />
        <StatCard icon={<Ship className="w-6 h-6" />} label="Deployed (Onboard)" value={data.activeCrew} color="green" />
        <StatCard icon={<UserCheck className="w-6 h-6" />} label="In Pool" value={data.availableCrew} color="purple" />
        <StatCard icon={<AlertCircle className="w-6 h-6" />} label="Open Alerts" value={data.totalAlerts} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-marine-600" />
            Fleet Composition
          </h2>
          {data.totalCrew === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No crew data yet</p>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Positions ({positions.length})</p>
                <div className="flex flex-wrap gap-2">
                  {positions.map(p => <span key={p} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{p}</span>)}
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Nationalities ({nationalities.length})</p>
                <div className="flex flex-wrap gap-2">
                  {nationalities.map(n => <span key={n} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">{n}</span>)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500" />
            Certificate Health
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Valid (&gt;90 days)</span>
              <span className="font-bold text-green-700">{data.totalCerts - data.expiringCerts}</span>
            </div>
            <progress
              aria-label="Percentage of valid certificates"
              value={data.totalCerts ? Math.round(((data.totalCerts - data.expiringCerts) / data.totalCerts) * 100) : 0}
              max={100}
              className="w-full h-2 rounded-full progress-cert"
            />
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm text-gray-700">Expiring (&le;90 days)</span>
              <span className="font-bold text-yellow-700">{data.expiringCerts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Total Certificates</span>
              <span className="font-bold text-gray-700">{data.totalCerts}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Ship className="w-5 h-5 text-marine-600" /> Crew Deployment Status
        </h2>
        {data.crew.length === 0 ? (
          <p className="text-center py-8 text-gray-400">No crew yet — add crew via Crew Manager</p>
        ) : (
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
                {data.crew.map(c => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{c.name}</td>
                    <td className="px-4 py-2">{c.position}</td>
                    <td className="px-4 py-2">{c.nationality}</td>
                    <td className="px-4 py-2"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data.expiringCerts > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800">Fleet Compliance Action Required</p>
              <p className="text-sm text-yellow-700 mt-1">
                {data.expiringCerts} certificate(s) expire within 90 days. Coordinate renewals with crew managers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
