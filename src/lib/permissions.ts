/**
 * Role-based access control.
 *
 * This mirrors the database policies in supabase/migrations/0002_rls.sql — it
 * decides what the UI offers, never what the server allows. Every rule here has
 * a policy behind it; if the two ever disagree, the database wins.
 */

export const ROLES = ['OWNER', 'ADMIN', 'REGIONAL_MANAGER', 'OUTLET_MANAGER', 'STAFF'] as const
export type Role = (typeof ROLES)[number]

export const PERMISSIONS = [
  'org:update',
  'org:delete',
  'billing:manage',
  'team:manage',
  'outlet:create',
  'outlet:update',
  'outlet:archive',
  'campaign:create',
  'campaign:update',
  'campaign:archive',
  'product:manage',
  'feedback:view',
  'feedback:triage',
  'feedback:respond',
  'analytics:view',
  'analytics:export',
  'insights:view',
] as const
export type Permission = (typeof PERMISSIONS)[number]

const MATRIX: Record<Role, Permission[]> = {
  OWNER: [...PERMISSIONS],
  ADMIN: PERMISSIONS.filter((permission) => permission !== 'org:delete'),
  REGIONAL_MANAGER: [
    'outlet:update',
    'campaign:create',
    'campaign:update',
    'campaign:archive',
    'product:manage',
    'feedback:view',
    'feedback:triage',
    'feedback:respond',
    'analytics:view',
    'analytics:export',
    'insights:view',
  ],
  OUTLET_MANAGER: [
    'campaign:create',
    'campaign:update',
    'campaign:archive',
    'feedback:view',
    'feedback:triage',
    'feedback:respond',
    'analytics:view',
    'insights:view',
  ],
  STAFF: ['feedback:view', 'feedback:triage', 'feedback:respond'],
}

/** Roles whose reach is the whole organization rather than assigned outlets. */
const ORG_WIDE: Role[] = ['OWNER', 'ADMIN']

export function permissionsFor(role: Role): Permission[] {
  return MATRIX[role]
}

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role].includes(permission)
}

export function isOrgWide(role: Role): boolean {
  return ORG_WIDE.includes(role)
}

/**
 * Whether a member may act on an outlet. Org-wide roles reach every outlet;
 * everyone else is limited to their assignments — the same rule as
 * `app_can_see_outlet()` in the database.
 */
export function canAccessOutlet(role: Role, assignedOutletIds: string[], outletId: string): boolean {
  return isOrgWide(role) || assignedOutletIds.includes(outletId)
}

/** Outlets a member may see, given every outlet in the organization. */
export function visibleOutlets<T extends { id: string }>(
  role: Role,
  assignedOutletIds: string[],
  outlets: T[],
): T[] {
  return isOrgWide(role) ? outlets : outlets.filter((outlet) => assignedOutletIds.includes(outlet.id))
}

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  REGIONAL_MANAGER: 'Regional manager',
  OUTLET_MANAGER: 'Outlet manager',
  STAFF: 'Staff',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  OWNER: 'Full access, including billing and deleting the organization.',
  ADMIN: 'Everything except deleting the organization.',
  REGIONAL_MANAGER: 'Manages the outlets assigned to them, including exports.',
  OUTLET_MANAGER: 'Runs one outlet: its campaigns, feedback and analytics.',
  STAFF: 'Handles feedback for their assigned outlets.',
}
