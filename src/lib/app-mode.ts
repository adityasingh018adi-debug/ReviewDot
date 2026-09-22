/**
 * How this deployment runs.
 *
 * Three modes, decided once and never guessed at:
 *
 *   live          Supabase is configured. Authentication is enforced.
 *   demo          Supabase is absent and NEXT_PUBLIC_DEMO_MODE is deliberately
 *                 set. The dashboard runs on the seeded demo dataset.
 *   unconfigured  Supabase is absent and nothing opted into demo mode. The
 *                 dashboard refuses to render.
 *
 * The ordering matters and is the whole point: a *missing* environment variable
 * can only ever move the app towards refusing to serve, never towards serving
 * an unauthenticated dashboard. Demo mode has to be asked for, and asking for it
 * on a deployment that has a database does nothing — `live` always wins. That is
 * the difference between a demo switch and an authentication bypass.
 */

export type AppMode = 'live' | 'demo' | 'unconfigured'

export type ModeEnv = {
  supabaseUrl?: string
  supabaseAnonKey?: string
  demoFlag?: string
}

/** Pure so it can be tested; `appMode()` supplies the real environment. */
export function resolveMode(env: ModeEnv): AppMode {
  if (env.supabaseUrl && env.supabaseAnonKey) return 'live'
  if (env.demoFlag === '1' || env.demoFlag === 'true') return 'demo'
  return 'unconfigured'
}

/**
 * Read as literals, never `process.env[name]`: Next inlines NEXT_PUBLIC_* at
 * build time by matching the literal expression, and a computed lookup silently
 * returns undefined in the browser.
 */
export function modeEnv(): ModeEnv {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined,
    demoFlag: process.env.NEXT_PUBLIC_DEMO_MODE || undefined,
  }
}

export function appMode(): AppMode {
  return resolveMode(modeEnv())
}

/** True when real accounts, sessions and row level security are in play. */
export function isLive(): boolean {
  return appMode() === 'live'
}

/** True when the app is running on the seeded dataset with no database. */
export function isDemo(): boolean {
  return appMode() === 'demo'
}
