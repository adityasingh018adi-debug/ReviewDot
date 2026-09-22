/**
 * Packages the production build as a Next.js app.
 *
 * Hostinger's deployment for this site is configured with Framework: Next.js,
 * so its build step requires a `.next` output directory. This wrapper gives it
 * a genuine `next build` while still serving the Vite SPA: the build output
 * lives in `public/`, and rewrites point every route at the app shell. The SPA
 * is hash-routed, so no per-route handling is needed beyond that.
 *
 * Run after `npm run build`.
 */
import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)
const OUT = join(process.cwd(), 'reviewdot-hostinger-next.zip')
const NEXT_VERSION = '^15.5.4'

if (!(await stat('dist').catch(() => null))) {
  console.error('dist/ is missing — run `npm run build` first.')
  process.exit(1)
}

const pkg = JSON.parse(await readFile('package.json', 'utf8'))
const stage = await mkdtemp(join(tmpdir(), 'reviewdot-next-'))

// the Vite build becomes static assets; app.html is the shell every route serves
await cp('dist', join(stage, 'public'), { recursive: true })
await cp(join(stage, 'public', 'index.html'), join(stage, 'public', 'app.html'))
await rm(join(stage, 'public', 'index.html'))

await writeFile(
  join(stage, 'package.json'),
  `${JSON.stringify(
    {
      name: pkg.name,
      private: true,
      version: pkg.version,
      description: pkg.description,
      engines: { node: '>=20' },
      scripts: { build: 'next build', start: 'next start' },
      dependencies: {
        next: NEXT_VERSION,
        react: pkg.dependencies.react,
        'react-dom': pkg.dependencies['react-dom'],
      },
    },
    null,
    2,
  )}\n`,
)

await writeFile(
  join(stage, 'next.config.mjs'),
  `/** @type {import('next').NextConfig} */
export default {
  // every request serves the SPA shell; \`afterFiles\` lets real files in
  // public/ (assets, fonts, favicon) win before the fallback applies
  async rewrites() {
    return {
      beforeFiles: [{ source: '/', destination: '/app.html' }],
      afterFiles: [],
      fallback: [{ source: '/:path*', destination: '/app.html' }],
    }
  },
}
`,
)

// Next requires an app directory; these routes are never reached because the
// rewrites above take precedence, but the build needs them to exist.
await mkdir(join(stage, 'app'), { recursive: true })
await writeFile(
  join(stage, 'app', 'layout.jsx'),
  `export const metadata = { title: 'ReviewDot' }

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`,
)
await writeFile(
  join(stage, 'app', 'page.jsx'),
  `export default function Page() {
  return null
}
`,
)

await rm(OUT, { force: true })
try {
  await run('zip', ['-qr', OUT, '.'], { cwd: stage })
} catch {
  await run('python3', [
    '-c',
    'import shutil,sys; shutil.make_archive(sys.argv[1], "zip", sys.argv[2])',
    OUT.replace(/\.zip$/, ''),
    stage,
  ])
}

const { size } = await stat(OUT)
console.log(
  `reviewdot-hostinger-next.zip — ${(size / 1024 / 1024).toFixed(1)} MB (public/ + app/ + next.config.mjs)`,
)
console.log(`staged at ${stage}`)
