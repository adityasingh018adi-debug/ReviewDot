import { describe, expect, it } from 'vitest'
import { ROLES, can, canAccessOutlet, isOrgWide, permissionsFor, visibleOutlets } from './permissions'
import { PLANS, checkQuota, hasFeature, planByCode, UNLIMITED } from './plans'

describe('permissions', () => {
  it('gives the owner everything and the admin everything but deletion', () => {
    expect(can('OWNER', 'org:delete')).toBe(true)
    expect(can('ADMIN', 'org:delete')).toBe(false)
    expect(can('ADMIN', 'team:manage')).toBe(true)
  })

  it('keeps billing and team management away from non-admin roles', () => {
    for (const role of ['REGIONAL_MANAGER', 'OUTLET_MANAGER', 'STAFF'] as const) {
      expect(can(role, 'billing:manage')).toBe(false)
      expect(can(role, 'team:manage')).toBe(false)
      expect(can(role, 'outlet:create')).toBe(false)
    }
  })

  it('lets every role at least see and triage feedback', () => {
    for (const role of ROLES) {
      expect(can(role, 'feedback:view')).toBe(true)
      expect(can(role, 'feedback:triage')).toBe(true)
    }
  })

  it('narrows permissions as the role narrows', () => {
    const counts = ROLES.map((role) => permissionsFor(role).length)
    expect(counts).toEqual([...counts].sort((a, b) => b - a))
  })

  it('scopes outlet access to assignments for non-org-wide roles', () => {
    expect(isOrgWide('OWNER')).toBe(true)
    expect(isOrgWide('OUTLET_MANAGER')).toBe(false)
    expect(canAccessOutlet('OWNER', [], 'outlet-1')).toBe(true)
    expect(canAccessOutlet('OUTLET_MANAGER', ['outlet-1'], 'outlet-1')).toBe(true)
    expect(canAccessOutlet('OUTLET_MANAGER', ['outlet-1'], 'outlet-2')).toBe(false)
  })

  it('filters outlet lists the same way the database policy does', () => {
    const outlets = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(visibleOutlets('ADMIN', [], outlets)).toHaveLength(3)
    expect(visibleOutlets('STAFF', ['b'], outlets)).toEqual([{ id: 'b' }])
  })
})

describe('plans', () => {
  it('allows creation up to the limit and blocks past it', () => {
    const free = PLANS.FREE
    expect(checkQuota(free, 'outlets', 0).allowed).toBe(true)
    const blocked = checkQuota(free, 'outlets', 1)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.message).toContain('Upgrade')
  })

  it('treats -1 as unlimited', () => {
    const check = checkQuota(PLANS.ENTERPRISE, 'outlets', 5000)
    expect(check.allowed).toBe(true)
    expect(check.unlimited).toBe(true)
    expect(PLANS.ENTERPRISE.limits.outlets).toBe(UNLIMITED)
  })

  it('gates features by plan', () => {
    expect(hasFeature(PLANS.FREE, 'exports')).toBe(false)
    expect(hasFeature(PLANS.STARTER, 'exports')).toBe(true)
    expect(hasFeature(PLANS.GROWTH, 'api_access')).toBe(false)
    expect(hasFeature(PLANS.BUSINESS, 'api_access')).toBe(true)
  })

  it('increases limits monotonically up the ladder', () => {
    const order = ['FREE', 'STARTER', 'GROWTH', 'BUSINESS'] as const
    const outlets = order.map((code) => PLANS[code].limits.outlets)
    expect(outlets).toEqual([...outlets].sort((a, b) => a - b))
  })

  it('falls back to the free plan for an unknown code', () => {
    expect(planByCode('NOPE').code).toBe('FREE')
    expect(planByCode('GROWTH').code).toBe('GROWTH')
  })
})

/**
 * The matrix and the database policies have to agree, or the UI offers buttons
 * the database refuses. Writing the QR form surfaced three places where they
 * did not; 0008_role_alignment.sql widened the policies to match these, so
 * these assertions are now the statement of intent that migration encodes.
 */
describe('the role matrix the policies mirror', () => {
  it('lets a regional manager run the outlets assigned to them', () => {
    for (const permission of ['campaign:create', 'campaign:update', 'campaign:archive', 'outlet:update', 'product:manage'] as const) {
      expect(can('REGIONAL_MANAGER', permission), permission).toBe(true)
    }
  })

  it('but not create or archive an outlet, which stays with the admins', () => {
    expect(can('REGIONAL_MANAGER', 'outlet:create')).toBe(false)
    expect(can('REGIONAL_MANAGER', 'outlet:archive')).toBe(false)
  })

  it('lets an outlet manager run their codes but not the outlet itself', () => {
    expect(can('OUTLET_MANAGER', 'campaign:create')).toBe(true)
    expect(can('OUTLET_MANAGER', 'outlet:update')).toBe(false)
    expect(can('OUTLET_MANAGER', 'product:manage')).toBe(false)
  })

  it('keeps staff to handling feedback', () => {
    expect(can('STAFF', 'feedback:respond')).toBe(true)
    expect(can('STAFF', 'campaign:create')).toBe(false)
    expect(can('STAFF', 'outlet:update')).toBe(false)
  })
})
