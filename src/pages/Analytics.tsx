import { useState } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import {
  TrendingUp,
  Star,
  Target,
  Clock3,
  FileDown,
  FileSpreadsheet,
  FileText,
  BarChartHorizontal,
} from 'lucide-react'
import { useDataset } from '@/lib/data'
import { useBusiness, businessProfile } from '@/lib/business'
import { exportAnalyticsCsv, exportExcel, exportPdf } from '@/lib/export'
import { useToasts } from '@/store/workspace'
import { AreaChart } from '@/components/charts/AreaChart'
import { BarChart } from '@/components/charts/BarChart'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const ranges = ['30D', '90D', '12M'] as const
type Range = (typeof ranges)[number]

/** Scales a series to fake different time ranges for the demo. */
function scaleSeries(values: number[], range: Range) {
  const factor = range === '30D' ? 0.33 : range === '90D' ? 0.75 : 1
  return values.map((v, i) => Math.round(v * factor * (1 + Math.sin(i * 1.7) * 0.08)))
}

function PanelHeader({ icon: Icon, title, tint }: { icon: typeof Star; title: string; tint: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className={cn('grid h-8 w-8 place-items-center rounded-lg border border-edge bg-white/4', tint)}>
        <Icon size={15} />
      </span>
      <h3 className="font-display text-sm font-semibold">{title}</h3>
    </div>
  )
}

/** Clean summary shown only when printing (File → Save as PDF). */
function PrintableReport() {
  const dataset = useDataset()
  const name = useBusiness((s) => s.name)
  const profile = businessProfile(dataset.type)

  return (
    <div id="print-report" className="hidden">
      <h1>{name} — Reputation Report</h1>
      <p>
        {profile.label} · Generated {new Date().toLocaleDateString()} by ReviewDot
      </p>
      <h2>Key metrics</h2>
      <table>
        <tbody>
          {dataset.kpis.map((k) => (
            <tr key={k.id}>
              <td>{k.label}</td>
              <td>
                {k.value}
                {k.suffix ?? ''}
              </td>
              <td>
                {k.delta > 0 ? '+' : ''}
                {k.delta}% vs last month
              </td>
            </tr>
          ))}
          <tr>
            <td>Business health score</td>
            <td>
              {dataset.health.score} ({dataset.health.grade})
            </td>
            <td />
          </tr>
        </tbody>
      </table>
      <h2>Top complaint topics</h2>
      <table>
        <tbody>
          {dataset.topComplaints.map((c) => (
            <tr key={c.name}>
              <td>{c.name}</td>
              <td>{c.value} mentions</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>AI action suggestions</h2>
      <ol>
        {dataset.actions.map((a) => (
          <li key={a.id}>
            <strong>{a.title}.</strong> {a.body} <em>Recommended action: {a.action}.</em>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function Analytics() {
  const [range, setRange] = useState<Range>('12M')
  const dataset = useDataset()
  const businessName = useBusiness((s) => s.name)
  const pushToast = useToasts((s) => s.push)

  const growth = Math.round(
    ((dataset.trendSeries.reviews[11] - dataset.trendSeries.reviews[10]) / dataset.trendSeries.reviews[10]) *
      100,
  )

  return (
    <div className="space-y-5">
      <PrintableReport />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Analytics</h1>
          <p className="mt-1 text-sm text-mist-400">
            Understand your customers — and act on what they tell you.
          </p>
        </div>

        <LayoutGroup id="range">
          <div className="glass flex gap-1 rounded-xl p-1">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  'relative rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  range === r ? 'text-mist-50' : 'text-mist-400 hover:text-mist-100',
                )}
              >
                {range === r && (
                  <motion.span
                    layoutId="range-pill"
                    className="absolute inset-0 rounded-lg bg-pulse-500/25 shadow-glow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{r}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassPanel
          className="p-5 lg:col-span-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
        >
          <PanelHeader icon={TrendingUp} title={`Review growth · ${range}`} tint="text-pulse-300" />
          <AreaChart
            key={range}
            labels={dataset.trendSeries.labels}
            series={[
              {
                name: 'Reviews',
                color: 'var(--color-pulse-400)',
                values: scaleSeries(dataset.trendSeries.reviews, range),
              },
              {
                name: 'Replies',
                color: 'var(--color-cyan-glow)',
                values: scaleSeries(dataset.trendSeries.responses, range),
              },
            ]}
          />
        </GlassPanel>

        <GlassPanel
          className="p-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3 }}
        >
          <PanelHeader icon={Target} title="Customer satisfaction" tint="text-mint-400" />
          <div className="flex flex-col items-center gap-3 py-2">
            <ProgressRing
              value={dataset.csat}
              size={120}
              stroke={9}
              color="var(--color-mint-400)"
              label="CSAT"
            />
            <p className="text-center text-xs leading-relaxed text-mist-400">
              {dataset.csat}% of customers rate you 4★ or higher. Review growth is{' '}
              <span className="font-semibold text-mint-400">+{growth}%</span> this month.
            </p>
          </div>
        </GlassPanel>

        <GlassPanel
          className="p-5 lg:col-span-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.11, duration: 0.3 }}
        >
          <PanelHeader icon={Star} title="Rating trend" tint="text-amber-glow" />
          <AreaChart
            labels={dataset.trendSeries.labels}
            series={[{ name: 'Avg rating', color: 'var(--color-amber-glow)', values: dataset.ratingTrend }]}
            height={200}
          />
          <p className="mt-1 text-[11px] text-mist-500">
            Average rating climbed from {dataset.ratingTrend[0].toFixed(2)}★ to{' '}
            {dataset.ratingTrend[11].toFixed(2)}★ over the last 12 months.
          </p>
        </GlassPanel>

        <GlassPanel
          className="p-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.3 }}
        >
          <PanelHeader icon={BarChartHorizontal} title="Top complaint topics" tint="text-rose-glow" />
          <BarChart data={dataset.topComplaints} color="var(--color-rose-glow)" />
        </GlassPanel>

        <GlassPanel
          className="p-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17, duration: 0.3 }}
        >
          <PanelHeader icon={Target} title="Volume by platform" tint="text-aura-400" />
          <BarChart data={dataset.platformVolumes} color="var(--color-aura-400)" />
        </GlassPanel>

        <GlassPanel
          className="p-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <PanelHeader icon={Clock3} title="Median response time" tint="text-cyan-glow" />
          <div className="grid place-items-center py-6 text-center">
            <div>
              <div className="font-display text-gradient text-5xl font-bold">
                <AnimatedNumber value={2.4} decimals={1} suffix="h" />
              </div>
              <div className="mt-2 text-xs text-mist-400">down from 9.1h before AI drafts</div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel
          className="p-5 lg:col-span-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.23, duration: 0.3 }}
        >
          <PanelHeader icon={FileDown} title="Reports" tint="text-pulse-300" />
          <p className="mb-4 text-xs text-mist-400">
            Share your reputation performance with partners, staff meetings, or head office.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="md" onClick={() => exportPdf()}>
              <FileText size={15} /> PDF report
            </Button>
            <Button
              variant="glass"
              size="md"
              onClick={() => {
                exportExcel(dataset, businessName)
                pushToast({
                  tone: 'success',
                  title: 'Excel report ready',
                  body: 'reviewdot-report.xls downloaded.',
                })
              }}
            >
              <FileSpreadsheet size={15} /> Excel workbook
            </Button>
            <Button
              variant="glass"
              size="md"
              onClick={() => {
                exportAnalyticsCsv(dataset)
                pushToast({
                  tone: 'success',
                  title: 'CSV export ready',
                  body: 'reviewdot-analytics.csv downloaded.',
                })
              }}
            >
              <FileDown size={15} /> CSV data
            </Button>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
