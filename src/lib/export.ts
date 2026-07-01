import { reviews, kpis, platformVolumes } from './data'

function csvEscape(value: string | number): string {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Downloads all reviews as a CSV file. */
export function exportReviewsCsv() {
  downloadCsv('reviewdot-reviews.csv', [
    [
      'id',
      'author',
      'rating',
      'platform',
      'sentiment',
      'status',
      'title',
      'body',
      'product',
      'location',
      'date',
      'tags',
    ],
    ...reviews.map((r) => [
      r.id,
      r.author,
      r.rating,
      r.platform,
      r.sentiment,
      r.status,
      r.title,
      r.body,
      r.product,
      r.location,
      r.date.toISOString(),
      r.tags.join('|'),
    ]),
  ])
}

/** Downloads an analytics summary (KPIs + platform volumes) as CSV. */
export function exportAnalyticsCsv() {
  downloadCsv('reviewdot-analytics.csv', [
    ['metric', 'value', 'delta_pct'],
    ...kpis.map((k) => [k.label, k.value, k.delta]),
    [],
    ['platform', 'reviews', ''],
    ...platformVolumes.map((p) => [p.name, p.value, '']),
  ])
}
