/**
 * Packages the production build for Hostinger's Node.js app hosting:
 * dist/ + server.js + a minimal package.json whose `start` serves the build.
 * Run after `npm run build`.
 */
import { cp, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)
const OUT = join(process.cwd(), 'reviewdot-hostinger.zip')

if (!(await stat('dist').catch(() => null))) {
  console.error('dist/ is missing — run `npm run build` first.')
  process.exit(1)
}

const pkg = JSON.parse(await readFile('package.json', 'utf8'))
const stage = await mkdtemp(join(tmpdir(), 'reviewdot-bundle-'))

await cp('dist', join(stage, 'dist'), { recursive: true })
await cp('server.js', join(stage, 'server.js'))
await writeFile(
  join(stage, 'package.json'),
  `${JSON.stringify(
    {
      name: pkg.name,
      private: true,
      version: pkg.version,
      type: 'module',
      description: pkg.description,
      engines: { node: '>=20' },
      scripts: { build: 'echo "dist/ is prebuilt — nothing to build"', start: 'node server.js' },
    },
    null,
    2,
  )}\n`,
)

await rm(OUT, { force: true })
try {
  await run('zip', ['-qr', OUT, '.'], { cwd: stage })
} catch {
  // `zip` is not installed everywhere; Python's stdlib is the portable fallback
  await run('python3', [
    '-c',
    'import shutil,sys; shutil.make_archive(sys.argv[1], "zip", sys.argv[2])',
    OUT.replace(/\.zip$/, ''),
    stage,
  ])
}
await rm(stage, { recursive: true, force: true })

const { size } = await stat(OUT)
console.log(`reviewdot-hostinger.zip — ${(size / 1024 / 1024).toFixed(1)} MB (dist/ + server.js + package.json)`)
