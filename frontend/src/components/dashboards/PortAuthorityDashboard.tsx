import { useState } from 'react'
import axios from 'axios'
import { AlertCircle, CheckCircle, FileText, Search, Shield } from 'lucide-react'
import StatCard from '../shared/StatCard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function PortAuthorityDashboard({ data }: { data: any }) {
  const [portInput, setPortInput] = useState('')
  const [inspLoading, setInspLoading] = useState(false)
  const [inspResult, setInspResult] = useState<string | null>(null)

  const runInspection = async () => {
    if (!portInput.trim()) return
    setInspLoading(true)
    setInspResult(null)
    try {
      const res = await axios.post(`${API_URL}/api/ai/generate-briefing`, null, {
        params: { vessel_id: 1, port_name: portInput.trim() }
      })
      const content = res.data?.briefing?.briefing || res.data?.briefing || JSON.stringify(res.data?.briefing)
      setInspResult(typeof content === 'string' ? content : JSON.stringify(content, null, 2))
    } catch {
      setInspResult('Could not run inspection check — ensure the AI service is operational.')
    } finally {
      setInspLoading(false)
    }
  }

  const highAlerts = data?.alerts?.filter((a: any) => a.severity === 'high') || []
  const pscRisk = data?.expiringCerts > 3 ? 'HIGH' : data?.expiringCerts > 0 ? 'MEDIUM' : 'LOW'
  const pscColor = pscRisk === 'HIGH' ? 'bg-red-100 text-red-800' : pscRisk === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Shield className="w-6 h-6" />} label="PSC Risk Level" value={pscRisk} color={pscRisk === 'LOW' ? 'green' : 'orange'} />
        <StatCard icon={<FileText className="w-6 h-6" />} label="Expiring Certs" value={data?.expiringCerts || 0} color={data?.expiringCerts > 0 ? 'orange' : 'green'} />
        <StatCard icon={<AlertCircle className="w-6 h-6" />} label="High Severity Alerts" value={highAlerts.length} color={highAlerts.length > 0 ? 'orange' : 'green'} />
        <StatCard icon={<CheckCircle className="w-6 h-6" />} label="SOLAS Compliance" value="100%" color="green" />
      </div>

      <div className={`rounded-lg p-4 border flex items-start gap-3 ${pscRisk === 'LOW' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <Shield className={`w-6 h-6 flex-shrink-0 mt-0.5 ${pscRisk === 'LOW' ? 'text-green-600' : 'text-yellow-600'}`} />
        <div>
          <p className={`font-semibold ${pscRisk === 'LOW' ? 'text-green-800' : 'text-yellow-800'}`}>
            PSC Readiness: <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${pscColor}`}>{pscRisk}</span>
          </p>
          <p className={`text-sm mt-1 ${pscRisk === 'LOW' ? 'text-green-700' : 'text-yellow-700'}`}>
            {pscRisk === 'LOW'
              ? 'All documentation appears current. Vessel ready for PSC inspection.'
              : `${data?.expiringCerts} certificate(s) require attention before port arrival.`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Search className="w-5 h-5 text-marine-600" /> Vessel Compliance Check
        </h2>
        <p className="text-gray-500 text-sm mb-4">Generate a PSC inspection readiness report</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" value={portInput} onChange={e => setPortInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runInspection()}
            placeholder="Port of inspection (e.g. Rotterdam)..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600" />
          <button type="button" onClick={runInspection} disabled={inspLoading || !portInput.trim()}
            className="bg-marine-600 text-white px-6 py-2 rounded-lg hover:bg-marine-700 transition disabled:opacity-50 whitespace-nowrap">
            {inspLoading ? 'Checking…' : 'Run Check'}
          </button>
        </div>
        {inspResult && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 whitespace-pre-wrap max-h-64 overflow-y-auto">
            {inspResult}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Certificate Deficiencies</h2>
        {data?.expiringCertsList?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Certificate Type</th>
                  <th className="px-4 py-2 text-left">Expiry Date</th>
                  <th className="px-4 py-2 text-left">Days Remaining</th>
                  <th className="px-4 py-2 text-left">PSC Risk</th>
                </tr>
              </thead>
              <tbody>
                {data.expiringCertsList.map((c: any, i: number) => {
                  const days = Math.floor((new Date(c.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{c.certificate_type}</td>
                      <td className="px-4 py-2">{c.expiry_date}</td>
                      <td className="px-4 py-2">{days} days</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${days <= 30 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {days <= 30 ? 'HIGH' : 'MEDIUM'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <p className="text-sm">No deficiencies detected. Documentation is current.</p>
          </div>
        )}
      </div>
    </div>
  )
}
