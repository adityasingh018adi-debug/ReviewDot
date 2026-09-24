import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * A Server Component may render a client component, but it may not *call* a
 * function that lives in one.
 *
 * React replaces every export of a `'use client'` module with a reference stub
 * when the server imports it. Rendering a stub is the supported thing. Calling
 * one throws at runtime — "Attempted to call initialsOf() from the server" —
 * and only in a production build.
 *
 * This is here because exactly that shipped. `app/app/layout.tsx` imported
 * `initialsOf` from SessionProvider and called it, which threw on every live
 * dashboard render. Nothing caught it: TypeScript sees a perfectly good
 * function, the unit tests import the module directly, and the Playwright suite
 * runs in demo mode, where the layout hardcodes its initials and never reaches
 * the call. Real accounts hit it on the first page after signing in.
 *
 * Type-only imports are fine — they are erased before any of this matters.
 */

const ROOT = resolve(__dirname, '../..')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full)
  }
  return out
}

const isClientModule = (file: string) => /^\s*['"]use client['"]/.test(readFileSync(file, 'utf8'))

/** Resolve an import specifier to a file on disk, or null if it is a package. */
function resolveLocal(from: string, spec: string): string | null {
  let base: string
  if (spec.startsWith('@/')) base = join(ROOT, 'src', spec.slice(2))
  else if (spec.startsWith('.')) base = resolve(dirname(from), spec)
  else return null

  for (const candidate of [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
    try {
      if (statSync(candidate).isFile()) return candidate
    } catch {
      /* keep looking */
    }
  }
  return null
}

/** Value imports only: `import type {…}` and `{ type X }` are erased. */
function valueImports(source: string): { spec: string; names: string[] }[] {
  const found: { spec: string; names: string[] }[] = []
  const pattern = /import\s+(type\s+)?([^'"]*?)\s*from\s*['"]([^'"]+)['"]/g
  for (const [, typeOnly, clause, spec] of source.matchAll(pattern)) {
    if (typeOnly) continue
    const braces = clause.match(/\{([^}]*)\}/)
    const names = braces
      ? braces[1]!
          .split(',')
          .map((n) => n.trim())
          .filter((n) => n && !n.startsWith('type '))
          .map((n) => n.split(/\s+as\s+/)[0]!.trim())
      : []
    const def = clause.replace(/\{[^}]*\}/, '').replace(/,/g, '').trim()
    if (def) names.push(def)
    if (names.length) found.push({ spec, names })
  }
  return found
}

describe('the server/client boundary', () => {
  const serverFiles = walk(join(ROOT, 'app')).filter((f) => !isClientModule(f))

  it('has server files to check', () => {
    expect(serverFiles.length).toBeGreaterThan(20)
  })

  it('never imports a value from a "use client" module into a server file', () => {
    const offences: string[] = []

    for (const file of serverFiles) {
      const source = readFileSync(file, 'utf8')
      for (const { spec, names } of valueImports(source)) {
        const target = resolveLocal(file, spec)
        if (!target || !isClientModule(target)) continue

        // A component is rendered, not called — that is the supported use, and
        // React components are Capitalised by convention. Anything lowercase is
        // a plain function, which the server cannot call.
        const called = names.filter((n) => /^[a-z]/.test(n))
        if (called.length) {
          offences.push(
            `${file.replace(ROOT + '/', '')} imports { ${called.join(', ')} } from ${spec} ('use client')`,
          )
        }
      }
    }

    expect(offences).toEqual([])
  })
})
