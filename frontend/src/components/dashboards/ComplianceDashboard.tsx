import { useState } from 'react'
import axios from 'axios'
import { AlertCircle, CheckCircle, Ship } from 'lucide-react'
import StatCard from '../shared/StatCard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function ComplianceDashboard({ data }: { data: any }) {
  const [portInput, setPortInput] = useState('')
  const [briefingLoading, setBriefingLoading] = useState(false)
  const [briefingResult, setBriefingResult] = useState<string | null>(null)

  const generateBriefing = async () => {
    if (!portInput.trim()) return
    setBriefingLoading(true)
    setBriefingResult(null)
    try {
      const res = await axios.post(`${API_URL}/api/ai/generate-briefing`, null, {
        params: { vessel_id: 1, port_name: portInput.trim() }
      })
      const content = res.data?.briefing?.briefing || res.data?.briefing || JSON.stringify(res.data?.briefing)
      setBriefingResult(typeof content === 'string' ? content : JSON.stringify(content, null, 2))
    } catch {
      setBriefingResult('Could not generate briefing — ensure the AI service is running and a vessel exists.')
    } finally {
      setBriefingLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<CheckCircle className="w-6 h-6" />} label="STCW Compliance" value="98%" color="green" />
        <StatCard icon={<AlertCircle className="w-6 h-6" />} label="MLC Compliance" value="95%" color="orange" />
        <StatCard icon={<Ship className="w-6 h-6" />} label="SOLAS Compliance" value="100%" color="green" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-2">Compliance Briefing Generator</h2>
        <p className="text-gray-600 mb-4 text-sm">Generate AI-powered port compliance briefings</p>
        <div className="flex gap-3">
          <input
            type="text" value={portInput} onChange={e => setPortInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generateBriefing()}
            placeholder="Enter port name (e.g. Singapore)..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600"
          />
          <button type="button" onClick={generateBriefing} disabled={briefingLoading || !portInput.trim()}
            className="bg-marine-600 text-white px-6 py-2 rounded-lg hover:bg-marine-700 transition disabled:opacity-50">
            {briefingLoading ? 'Generating…' : 'Generate Briefing'}
          </button>
        </div>
        {briefingResult && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">
            {briefingResult}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Expiring Certificates (90 days)</h2>
        <div className="space-y-2">
          {data?.expiringCertsList?.length > 0
            ? data.expiringCertsList.map((c: any, idx: number) => {
                const daysLeft = Math.floor(
                  (new Date(c.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                )
                return (
                  <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm">{c.certificate_type}</p>
                      <p className="text-xs text-gray-600">Expires: {c.expiry_date}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${daysLeft <= 30 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {daysLeft}d
                    </span>
                  </div>
                )
              })
            : <p className="text-gray-500 text-sm">No certificates expiring in the next 90 days</p>
          }
        </div>
      </div>
    </div>
  )
}
