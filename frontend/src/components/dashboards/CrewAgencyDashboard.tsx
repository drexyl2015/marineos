import { useState } from 'react'
import { Anchor, FileText, Globe, Search, Users } from 'lucide-react'
import StatCard from '../shared/StatCard'

export default function CrewAgencyDashboard({ data }: { data: any }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPosition, setFilterPosition] = useState('all')

  const availableCrew = data?.crew?.filter((c: any) => c.status === 'available') || []
  const positions = ['all', ...new Set(availableCrew.map((c: any) => c.position))] as string[]

  const filtered = availableCrew.filter((c: any) => {
    const matchSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase())
      || c.position?.toLowerCase().includes(searchQuery.toLowerCase())
      || c.nationality?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchPosition = filterPosition === 'all' || c.position === filterPosition
    return matchSearch && matchPosition
  })

  const certCountForCrew = (crewId: number) =>
    (data?.certificates || []).filter((c: any) => c.crew_id === crewId).length

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<Users className="w-6 h-6" />} label="Available for Placement" value={availableCrew.length} color="green" />
        <StatCard icon={<Anchor className="w-6 h-6" />} label="Positions Available" value={positions.length - 1} color="blue" />
        <StatCard icon={<FileText className="w-6 h-6" />} label="Total Certifications" value={data?.totalCerts || 0} color="purple" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-marine-600" /> Available Crew Pool
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, position, nationality..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600" />
          <select aria-label="Filter by position" value={filterPosition} onChange={e => setFilterPosition(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 bg-white">
            {positions.map(p => <option key={p} value={p}>{p === 'all' ? 'All Positions' : p}</option>)}
          </select>
        </div>

        {availableCrew.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="font-medium">No available crew in the pool.</p>
            <p className="text-sm mt-1">Add crew with status "available" via the Crew Manager.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No crew matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c: any) => (
              <div key={c.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-marine-100 flex items-center justify-center text-marine-700 font-bold text-lg flex-shrink-0">
                    {c.name?.charAt(0) || '?'}
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">Available</span>
                </div>
                <h3 className="font-bold text-gray-900">{c.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{c.position}</p>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /><span>{c.nationality}</span></div>
                  <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /><span>{certCountForCrew(c.id)} certificate(s)</span></div>
                  {c.employee_id && <div className="flex items-center gap-1.5"><Anchor className="w-3.5 h-3.5" /><span>ID: {c.employee_id}</span></div>}
                </div>
                <div className="mt-3 pt-3 border-t flex gap-2">
                  <button type="button" className="flex-1 bg-marine-600 text-white text-xs py-1.5 rounded-lg hover:bg-marine-700 transition font-semibold">Request</button>
                  <button type="button" className="flex-1 border border-marine-600 text-marine-600 text-xs py-1.5 rounded-lg hover:bg-marine-50 transition font-semibold">Profile</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
