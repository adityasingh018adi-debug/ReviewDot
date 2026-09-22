import { describe, expect, it } from 'vitest'
import { resolveMode } from './app-mode'

describe('resolveMode', () => {
  const supabase = { supabaseUrl: 'https://x.supabase.co', supabaseAnonKey: 'anon-key' }

  it('is live when Supabase is configured', () => {
    expect(resolveMode(supabase)).toBe('live')
  })

  it('stays live even if demo mode is also set — a database always wins', () => {
    expect(resolveMode({ ...supabase, demoFlag: '1' })).toBe('live')
  })

  it('is demo only when demo mode is asked for explicitly', () => {
    expect(resolveMode({ demoFlag: '1' })).toBe('demo')
    expect(resolveMode({ demoFlag: 'true' })).toBe('demo')
  })

  it('refuses to serve when nothing is configured', () => {
    expect(resolveMode({})).toBe('unconfigured')
  })

  it('never treats a missing or empty variable as permission to skip auth', () => {
    // the failure mode this whole module exists to prevent
    for (const env of [
      {},
      { demoFlag: '' },
      { demoFlag: '0' },
      { demoFlag: 'false' },
      { demoFlag: 'yes' },
      { supabaseUrl: 'https://x.supabase.co' },
      { supabaseAnonKey: 'anon-key' },
    ]) {
      expect(resolveMode(env)).not.toBe('live')
      expect(resolveMode(env)).not.toBe('demo')
    }
  })

  it('needs both halves of the Supabase credentials to go live', () => {
    expect(resolveMode({ supabaseUrl: 'https://x.supabase.co', demoFlag: '1' })).toBe('demo')
  })
})
