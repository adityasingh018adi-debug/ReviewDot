import { afterEach, describe, expect, it, vi } from 'vitest'
import { attempt, reportError } from './observability'

function captured(): { lines: string[]; restore: () => void } {
  const lines: string[] = []
  const spy = vi.spyOn(console, 'error').mockImplementation((line: unknown) => {
    lines.push(String(line))
  })
  return { lines, restore: () => spy.mockRestore() }
}

afterEach(() => vi.restoreAllMocks())

describe('reportError', () => {
  it('writes one line of structured JSON', () => {
    const { lines } = captured()
    reportError('feedback.submit', new Error('connection refused'), { campaignId: 'c1' })
    expect(lines).toHaveLength(1)
    const record = JSON.parse(lines[0]!)
    expect(record).toMatchObject({
      level: 'error',
      scope: 'feedback.submit',
      message: 'connection refused',
      campaignId: 'c1',
    })
    expect(typeof record.at).toBe('string')
  })

  it('copes with things that are not Errors', () => {
    const { lines } = captured()
    reportError('scan.record', 'plain string')
    reportError('scan.record', { weird: true })
    expect(JSON.parse(lines[0]!).message).toBe('plain string')
    expect(JSON.parse(lines[1]!).message).toBe('unknown error')
  })
})

describe('attempt', () => {
  it('returns the value when the work succeeds, and logs nothing', () => {
    const { lines } = captured()
    return attempt('draft.save', {}, async () => 'ok').then((result) => {
      expect(result).toBe('ok')
      expect(lines).toHaveLength(0)
    })
  })

  it('swallows the failure so the customer flow continues, but records it', async () => {
    const { lines } = captured()
    const result = await attempt('draft.save', { feedbackId: 'f1' }, async () => {
      throw new Error('insert failed')
    })
    expect(result).toBeUndefined()
    expect(JSON.parse(lines[0]!)).toMatchObject({ scope: 'draft.save', feedbackId: 'f1' })
  })
})
