import { describe, expect, it } from 'vitest'
import { clientIp, createRateLimiter } from './rate-limit'

describe('createRateLimiter', () => {
  it('allows up to the limit and then refuses', () => {
    const clock = 1_000
    const rl = createRateLimiter(() => clock)
    for (let i = 0; i < 3; i += 1) {
      expect(rl.check('a', 3, 60_000).ok, `request ${i + 1}`).toBe(true)
    }
    expect(rl.check('a', 3, 60_000).ok).toBe(false)
  })

  it('reports how long until the window frees up', () => {
    let clock = 1_000
    const rl = createRateLimiter(() => clock)
    rl.check('a', 1, 60_000)
    clock += 10_000
    const refused = rl.check('a', 1, 60_000)
    expect(refused.ok).toBe(false)
    expect(refused.retryAfterMs).toBe(50_000)
  })

  it('lets the caller through again once the window has passed', () => {
    let clock = 1_000
    const rl = createRateLimiter(() => clock)
    rl.check('a', 1, 60_000)
    clock += 60_001
    expect(rl.check('a', 1, 60_000).ok).toBe(true)
  })

  it('keeps separate buckets per key', () => {
    const clock = 1_000
    const rl = createRateLimiter(() => clock)
    rl.check('a', 1, 60_000)
    expect(rl.check('a', 1, 60_000).ok).toBe(false)
    expect(rl.check('b', 1, 60_000).ok).toBe(true)
  })

  it('counts down the remaining allowance', () => {
    const rl = createRateLimiter(() => 1_000)
    expect(rl.check('a', 3, 60_000).remaining).toBe(2)
    expect(rl.check('a', 3, 60_000).remaining).toBe(1)
    expect(rl.check('a', 3, 60_000).remaining).toBe(0)
  })

  it('does not grow without bound when keys are never seen again', () => {
    let clock = 1_000
    const rl = createRateLimiter(() => clock)
    // a scan across many addresses, each seen once
    for (let i = 0; i < 600; i += 1) rl.check(`ip-${i}`, 5, 1_000)
    clock += 5_000
    // the next call crosses the prune threshold and clears what has expired
    for (let i = 0; i < 500; i += 1) rl.check('current', 1_000, 1_000)
    expect(rl.size()).toBeLessThan(600)
  })
})

describe('clientIp', () => {
  it('takes the first entry of x-forwarded-for', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7')
  })

  it('falls back to x-real-ip, then to a constant', () => {
    expect(clientIp(new Headers({ 'x-real-ip': '198.51.100.4' }))).toBe('198.51.100.4')
    expect(clientIp(new Headers())).toBe('unknown')
  })
})
