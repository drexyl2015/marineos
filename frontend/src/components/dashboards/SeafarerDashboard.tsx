import { AlertCircle, Anchor, Calendar, Clock, FileText, Globe } from 'lucide-react'
import StatCard from '../shared/StatCard'
import StatusBadge from '../shared/StatusBadge'
import { daysUntil } from '../../lib/dates'
import type { DashboardData } from '../../types'

export default function SeafarerDashboard({ data }: { data: DashboardData }) {
  const seafarer = data.crew[0]
  const myCerts = data.certificates.filter(c => c.crew_id === seafarer?.id)
  const myAlerts = data.alerts.filter(a => a.crew_id === seafarer?.id)

  const certStatus = (expiryDate: string) => {
    const daysLeft = daysUntil(expiryDate)
    if (daysLeft < 0) return { label: 'Expired', color: 'bg-red-100 text-red-700' }
    if (daysLeft <= 30) return { label: `${daysLeft}d left`, color: 'bg-red-100 text-red-700' }
    if (daysLeft <= 90) return { label: `${daysLeft}d left`, color: 'bg-yellow-100 text-yellow-700' }
    return { label: 'Valid', color: 'bg-green-100 text-green-700' }
  }

  const nextExpiry = myCerts.length > 0
    ? myCerts.reduce((min, c) => new Date(c.expiry_date) < new Date(min.expiry_date) ? c : min)
    : null

  const daysToNext = nextExpiry ? Math.max(0, daysUntil(nextExpiry.expiry_date)) : null

  if (!seafarer) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="card p-8 text-center text-gray-500">
          No seafarer data available. Add crew members to get started.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="card p-6 flex items-start gap-6">
        <div className="w-16 h-16 rounded-full bg-marine-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {seafarer.name?.charAt(0) || '?'}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-marine-900">{seafarer.name}</h1>
          <p className="text-gray-600">{seafarer.position}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Globe className="w-4 h-4" />{seafarer.nationality}</span>
            <span className="flex items-center gap-1"><Anchor className="w-4 h-4" />ID: {seafarer.employee_id}</span>
          </div>
        </div>
        <StatusBadge status={seafarer.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<FileText className="w-6 h-6" />} label="My Certificates" value={myCerts.length} color="blue" />
        <StatCard icon={<Clock className="w-6 h-6" />} label="Next Expiry (days)"
          value={daysToNext !== null ? daysToNext : '—'}
          color={daysToNext !== null && daysToNext <= 90 ? 'orange' : 'green'} />
        <StatCard icon={<AlertCircle className="w-6 h-6" />} label="My Alerts"
          value={myAlerts.length}
          color={myAlerts.length > 0 ? 'orange' : 'green'} />
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold mb-4">My Certificates &amp; Licences</h2>
        {myCerts.length > 0 ? (
          <div className="space-y-3">
            {myCerts.map(c => {
              const status = certStatus(c.expiry_date)
              return (
                <div key={c.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-semibold text-sm">{c.type}</p>
                      <p className="text-xs text-gray-500">Issued: {c.issue_date} &nbsp;|&nbsp; Expires: {c.expiry_date}</p>
                      {c.authority && <p className="text-xs text-gray-400">{c.authority}</p>}
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${status.color}`}>{status.label}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No certificates found for this seafarer.</p>
        )}
      </div>

      {myAlerts.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-4">My Alerts</h2>
          <div className="space-y-2">
            {myAlerts.map((a, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold capitalize">{a.alert_type?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-600">{a.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-800 text-sm">Training &amp; Renewal Reminder</p>
            <p className="text-xs text-blue-700 mt-1">
              {daysToNext !== null && daysToNext <= 90
                ? `Your next certificate expires in ${daysToNext} days. Contact your crew manager to arrange renewal training.`
                : 'All your certificates are current. Check back regularly to stay on top of renewals.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
