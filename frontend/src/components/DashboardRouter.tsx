import { useState, useEffect } from 'react'
import axios from 'axios'
import { AlertCircle } from 'lucide-react'
import SuperAdminDashboard from './dashboards/SuperAdminDashboard'
import CrewManagerDashboard from './dashboards/CrewManagerDashboard'
import ComplianceDashboard from './dashboards/ComplianceDashboard'
import MasterDashboard from './dashboards/MasterDashboard'
import SeafarerDashboard from './dashboards/SeafarerDashboard'
import FleetOpsDashboard from './dashboards/FleetOpsDashboard'
import PortAuthorityDashboard from './dashboards/PortAuthorityDashboard'
import CrewAgencyDashboard from './dashboards/CrewAgencyDashboard'
import VesselDashboard from './dashboards/VesselDashboard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface DashboardRouterProps {
  selectedRole: string
}

export default function DashboardRouter({ selectedRole }: DashboardRouterProps) {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [selectedRole])

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [crewRes, certRes, alertsRes] = await Promise.all([
        axios.get(`${API_URL}/api/crew/`),
        axios.get(`${API_URL}/api/certificates/`),
        axios.get(`${API_URL}/api/alerts/`),
      ])

      const crew = crewRes.data.crew || []
      const certificates = certRes.data.certificates || []
      const alerts = alertsRes.data.alerts || []

      const now = new Date()
      const expiringCerts = certificates.filter((c: any) => {
        const daysLeft = Math.floor((new Date(c.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysLeft <= 90 && daysLeft > 0
      })

      setDashboardData({
        crew,
        certificates,
        alerts,
        totalCrew: crewRes.data.total || crew.length,
        totalCerts: certRes.data.total || certificates.length,
        totalAlerts: alertsRes.data.total || alerts.length,
        activeCrew: crew.filter((c: any) => c.status === 'onboard').length,
        availableCrew: crew.filter((c: any) => c.status === 'available').length,
        expiringCerts: expiringCerts.length,
        expiringCertsList: expiringCerts,
      })
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marine-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
        <button type="button" onClick={loadDashboardData} className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
          Retry
        </button>
      </div>
    )
  }

  if (selectedRole === 'super_admin')        return <SuperAdminDashboard data={dashboardData} onRefresh={loadDashboardData} />
  if (selectedRole === 'crew_manager')       return <CrewManagerDashboard data={dashboardData} onRefresh={loadDashboardData} />
  if (selectedRole === 'compliance_officer') return <ComplianceDashboard data={dashboardData} />
  if (selectedRole === 'master')             return <MasterDashboard data={dashboardData} />
  if (selectedRole === 'seafarer')           return <SeafarerDashboard data={dashboardData} />
  if (selectedRole === 'fleet_ops')          return <FleetOpsDashboard data={dashboardData} />
  if (selectedRole === 'port_authority')     return <PortAuthorityDashboard data={dashboardData} />
  if (selectedRole === 'crew_agency')        return <CrewAgencyDashboard data={dashboardData} />
  if (selectedRole === 'vessel_manager')     return <VesselDashboard crewList={dashboardData?.crew || []} />

  return <MasterDashboard data={dashboardData} />
}
