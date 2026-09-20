import { encodeQR, qrSvg } from './qr'

/* ------------------------------------------------------------------ *
 * CSV
 * ------------------------------------------------------------------ */

export function toCSV(rows: Record<string, string | number>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const escape = (value: string | number) => {
    const text = String(value ?? '')
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
  }
  return [headers.join(','), ...rows.map((row) => headers.map((key) => escape(row[key])).join(','))].join('\n')
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function downloadCSV(rows: Record<string, string | number>[], filename: string) {
  downloadBlob(new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8' }), filename)
}

/* ------------------------------------------------------------------ *
 * QR downloads
 * ------------------------------------------------------------------ */

export function downloadQRSvg(text: string, filename: string) {
  downloadBlob(new Blob([qrSvg(text, { size: 1024 })], { type: 'image/svg+xml' }), filename)
}

/** Rasterise the QR matrix directly — no SVG round-trip, so it never tints. */
export function downloadQRPng(text: string, filename: string, pixels = 1024, margin = 3) {
  const matrix = encodeQR(text)
  const total = matrix.size + margin * 2
  const scale = Math.max(1, Math.floor(pixels / total))
  const side = total * scale
  const canvas = document.createElement('canvas')
  canvas.width = side
  canvas.height = side
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, side, side)
  ctx.fillStyle = '#0a0c0b'
  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      if (!matrix.modules[row][col]) continue
      ctx.fillRect((col + margin) * scale, (row + margin) * scale, scale, scale)
    }
  }
  canvas.toBlob((blob) => blob && downloadBlob(blob, filename), 'image/png')
}

/* ------------------------------------------------------------------ *
 * Print / PDF
 * ------------------------------------------------------------------ */

export type PrintableQR = {
  businessName: string
  title: string
  subtitle: string
  url: string
  footnote?: string
}

/** A print-ready table card; the browser's print dialog saves it as PDF. */
export function qrSheetHtml(card: PrintableQR): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${card.title} — ReviewDot QR</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: Inter, -apple-system, Segoe UI, sans-serif; color: #0b0d0c; margin: 0; }
  .card { border: 1px solid #e7e8e3; border-radius: 28px; padding: 44px; text-align: center; max-width: 520px; margin: 0 auto; }
  .brand { font-size: 13px; letter-spacing: 0.22em; text-transform: uppercase; color: #0c6145; font-weight: 600; }
  h1 { font-size: 30px; margin: 18px 0 6px; letter-spacing: -0.02em; }
  p.sub { color: #6b736e; margin: 0 0 28px; font-size: 15px; }
  .qr { display: inline-block; padding: 18px; border-radius: 22px; border: 1px solid #e7e8e3; }
  .cta { margin-top: 26px; font-weight: 600; letter-spacing: 0.18em; font-size: 13px; text-transform: uppercase; }
  .url { margin-top: 10px; font-size: 13px; color: #6b736e; }
  .note { margin-top: 26px; font-size: 15px; color: #0c6145; }
</style></head>
<body onload="window.print()">
  <div class="card">
    <div class="brand">${card.businessName}</div>
    <h1>${card.title}</h1>
    <p class="sub">${card.subtitle}</p>
    <div class="qr">${qrSvg(card.url, { size: 260, margin: 1 })}</div>
    <div class="cta">Scan to review</div>
    <div class="url">${card.url.replace(/^https?:\/\//, '')}</div>
    ${card.footnote ? `<div class="note">${card.footnote}</div>` : ''}
  </div>
</body></html>`
}

export function printQRSheet(card: PrintableQR) {
  const win = window.open('', '_blank', 'width=860,height=1000')
  if (!win) return
  win.document.write(qrSheetHtml(card))
  win.document.close()
}
