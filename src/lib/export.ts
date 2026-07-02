import type { Dataset } from './data'

function csvEscape(value: string | number): string {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n')
  download(filename, new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
}

function reviewRows(dataset: Dataset): Array<Array<string | number>> {
  return [
    [
      'id',
      'author',
      'rating',
      'platform',
      'sentiment',
      'status',
      'title',
      'body',
      'service',
      'location',
      'date',
      'tags',
    ],
    ...dataset.reviews.map((r) => [
      r.id,
      r.author,
      r.rating,
      r.platform,
      r.sentiment,
      r.status,
      r.title,
      r.body,
      r.service,
      r.location,
      r.date.toISOString(),
      r.tags.join('|'),
    ]),
  ]
}

/** Downloads all reviews as a CSV file. */
export function exportReviewsCsv(dataset: Dataset) {
  downloadCsv('reviewdot-reviews.csv', reviewRows(dataset))
}

/** Downloads an analytics summary (KPIs + platforms + complaints) as CSV. */
export function exportAnalyticsCsv(dataset: Dataset) {
  downloadCsv('reviewdot-analytics.csv', [
    ['metric', 'value', 'delta_pct'],
    ...dataset.kpis.map((k) => [k.label, k.value, k.delta]),
    ['Business health score', dataset.health.score, ''],
    [],
    ['platform', 'reviews', ''],
    ...dataset.platformVolumes.map((p) => [p.name, p.value, '']),
    [],
    ['complaint topic', 'mentions', ''],
    ...dataset.topComplaints.map((c) => [c.name, c.value, '']),
  ])
}

/** Downloads an Excel-compatible workbook (SpreadsheetML) with summary + reviews sheets. */
export function exportExcel(dataset: Dataset, businessName: string) {
  const esc = (v: string | number) =>
    String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const cell = (v: string | number) =>
    typeof v === 'number'
      ? `<Cell><Data ss:Type="Number">${v}</Data></Cell>`
      : `<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`
  const sheet = (name: string, rows: Array<Array<string | number>>) =>
    `<Worksheet ss:Name="${esc(name)}"><Table>${rows
      .map((r) => `<Row>${r.map(cell).join('')}</Row>`)
      .join('')}</Table></Worksheet>`

  const summary: Array<Array<string | number>> = [
    [`${businessName} — Reputation Report`],
    [`Generated ${new Date().toLocaleDateString()}`],
    [],
    ['Metric', 'Value'],
    ...dataset.kpis.map((k): Array<string | number> => [k.label, `${k.value}${k.suffix ?? ''}`]),
    ['Business health score', `${dataset.health.score} (${dataset.health.grade})`],
    [],
    ['Top complaint topics', 'Mentions'],
    ...dataset.topComplaints.map((c): Array<string | number> => [c.name, c.value]),
  ]

  const xml =
    `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>` +
    `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">` +
    sheet('Summary', summary) +
    sheet('Reviews', reviewRows(dataset)) +
    `</Workbook>`

  download('reviewdot-report.xls', new Blob([xml], { type: 'application/vnd.ms-excel' }))
}

/** Opens the browser print dialog — users save the report as PDF. */
export function exportPdf() {
  window.print()
}
