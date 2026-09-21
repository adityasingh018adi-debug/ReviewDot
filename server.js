/**
 * Production server for Hostinger's Node.js app hosting.
 *
 * The app is a static Vite build, so this serves `dist/` with correct MIME
 * types, long-lived caching for content-hashed assets, and an SPA fallback to
 * index.html. Zero dependencies, so `npm ci --omit=dev` is enough to boot it.
 */
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), 'dist')
const PORT = Number(process.env.PORT) || 3000
const HOST = process.env.HOST || '0.0.0.0'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

/** Resolve a request path inside dist/, refusing anything that escapes it. */
function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0])
  const candidate = resolve(join(ROOT, normalize(decoded)))
  if (candidate !== ROOT && !candidate.startsWith(ROOT + '/')) return null
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  return null
}

const server = createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { allow: 'GET, HEAD' }).end()
    return
  }

  const file = resolveFile(request.url ?? '/') ?? join(ROOT, 'index.html')
  if (!existsSync(file)) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found')
    return
  }

  const ext = extname(file)
  const hashed = /-[A-Za-z0-9_]{8,}\./.test(file)
  response.writeHead(200, {
    'content-type': MIME[ext] ?? 'application/octet-stream',
    'content-length': statSync(file).size,
    'cache-control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache',
    'x-content-type-options': 'nosniff',
  })

  if (request.method === 'HEAD') {
    response.end()
    return
  }
  createReadStream(file).pipe(response)
})

server.listen(PORT, HOST, () => {
  console.log(`ReviewDot listening on http://${HOST}:${PORT}`)
})
