export interface Crew {
  id: number
  name: string
  employee_id?: string | null
  position: string
  status: string
  nationality: string
  email?: string | null
  phone?: string | null
}

/** Shape returned by GET /api/certificates/ (list serializer). */
export interface Certificate {
  id: number
  crew_id: number
  type: string
  issue_date: string
  expiry_date: string
  authority?: string | null
}

export interface Alert {
  id?: number
  crew_id?: number
  alert_type?: string
  severity?: string
  message: string
}

export interface DashboardData {
  crew: Crew[]
  certificates: Certificate[]
  alerts: Alert[]
  totalCrew: number
  totalCerts: number
  totalAlerts: number
  activeCrew: number
  availableCrew: number
  expiringCerts: number
  expiringCertsList: Certificate[]
}
