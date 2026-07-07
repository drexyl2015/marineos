import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { AlertCircle } from 'lucide-react'

// Dashboards are lazy-loaded so the initial bundle doesn't ship all nine of
// them (plus recharts) to visitors who never leave the landing page.
const SuperAdminDashboard = lazy(() => import('./dashboards/SuperAdminDashboard'))
const CrewManagerDashboard = lazy(() => import('./dashboards/CrewManagerDashboard'))
const ComplianceDashboard = lazy(() => import('./dashboards/ComplianceDashboard'))
const MasterDashboard = lazy(() => import('./dashboards/MasterDashboard'))
const SeafarerDashboard = lazy(() => import('./dashboards/SeafarerDashboard'))
const FleetOpsDashboard = lazy(() => import('./dashboards/FleetOpsDashboard'))
const PortAuthorityDashboard = lazy(() => import('./dashboards/PortAuthorityDashboard'))
const CrewAgencyDashboard = lazy(() => import('./dashboards/CrewAgencyDashboard'))
const VesselDashboard = lazy(() => import('./dashboards/VesselDashboard'))
import { api } from '../lib/api'
import { daysUntil } from '../lib/dates'
import type { Certificate, Crew, DashboardData } from '../types'

interface DashboardRouterProps {
  selectedRole: string
}

export default function DashboardRouter({ selectedRole }: DashboardRouterProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [crewRes, certRes, alertsRes] = await Promise.all([
        api.get('/api/crew/'),
        api.get('/api/certificates/'),
        api.get('/api/alerts/'),
      ])

      const crew: Crew[] = crewRes.data.crew || []
      const certificates: Certificate[] = certRes.data.certificates || []
      const alerts = alertsRes.data.alerts || []

      const expiringCerts = certificates.filter(c => {
        const daysLeft = daysUntil(c.expiry_date)
        return daysLeft <= 90 && daysLeft > 0
      })

      setDashboardData({
        crew,
        certificates,
        alerts,
        totalCrew: crewRes.data.total || crew.length,
        totalCerts: certRes.data.total || certificates.length,
        totalAlerts: alertsRes.data.total || alerts.length,
        activeCrew: crew.filter(c => c.status === 'onboard').length,
        availableCrew: crew.filter(c => c.status === 'available').length,
        expiringCerts: expiringCerts.length,
        expiringCertsList: expiringCerts,
      })
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marine-600"></div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <p className="text-red-700">{error || 'Failed to load dashboard data'}</p>
        </div>
        <button type="button" onClick={loadDashboardData} className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
          Retry
        </button>
      </div>
    )
  }

  const renderDashboard = () => {
    if (selectedRole === 'super_admin')        return <SuperAdminDashboard data={dashboardData} onRefresh={loadDashboardData} />
    if (selectedRole === 'crew_manager')       return <CrewManagerDashboard data={dashboardData} onRefresh={loadDashboardData} />
    if (selectedRole === 'compliance_officer') return <ComplianceDashboard data={dashboardData} />
    if (selectedRole === 'master')             return <MasterDashboard data={dashboardData} />
    if (selectedRole === 'seafarer')           return <SeafarerDashboard data={dashboardData} />
    if (selectedRole === 'fleet_ops')          return <FleetOpsDashboard data={dashboardData} />
    if (selectedRole === 'port_authority')     return <PortAuthorityDashboard data={dashboardData} />
    if (selectedRole === 'crew_agency')        return <CrewAgencyDashboard data={dashboardData} />
    if (selectedRole === 'vessel_manager')     return <VesselDashboard crewList={dashboardData.crew} />
    return <MasterDashboard data={dashboardData} />
  }

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marine-600"></div>
        </div>
      }
    >
      {renderDashboard()}
    </Suspense>
  )
}
