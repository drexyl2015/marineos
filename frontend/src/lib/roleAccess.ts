// Central definition of which dashboards an authenticated user may view.
//
// This mirrors the backend authorization model: role switching in the UI is a
// convenience, never a security boundary (the API enforces permissions). But to
// avoid showing users dashboards that don't match their permission level, the
// role switcher and dashboard router are constrained to the roles below.

export const ALL_ROLE_IDS = [
  'super_admin',
  'crew_manager',
  'compliance_officer',
  'master',
  'seafarer',
  'fleet_ops',
  'port_authority',
  'crew_agency',
  'vessel_manager',
] as const

export type RoleId = (typeof ALL_ROLE_IDS)[number]

function isRoleId(value: string): value is RoleId {
  return (ALL_ROLE_IDS as readonly string[]).includes(value)
}

/**
 * Roles whose dashboards the given authenticated user is allowed to view.
 * - super_admin can preview every dashboard (admin / support tool).
 * - everyone else is limited to their own role's dashboard.
 */
export function getAvailableRoles(userRole: string | undefined | null): RoleId[] {
  if (!userRole || !isRoleId(userRole)) return []
  if (userRole === 'super_admin') return [...ALL_ROLE_IDS]
  return [userRole]
}

/** The role a user should land on after logging in. */
export function defaultRoleFor(userRole: string | undefined | null): RoleId | '' {
  const available = getAvailableRoles(userRole)
  return available[0] ?? ''
}
