import { useEffect, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import { motion, useDragControls } from 'framer-motion'
import {
  GripVertical,
  Download,
  ArrowUpRight,
  Activity,
  PieChart,
  LineChart,
  HeartPulse,
  Sparkles,
  BarChartHorizontal,
} from 'lucide-react'
import { useWorkspace, useToasts } from '@/store/workspace'
import { useDataset, type Dataset } from '@/lib/data'
import { useBusiness, businessProfile } from '@/lib/business'
import { exportAnalyticsCsv } from '@/lib/export'
import { useInterval } from '@/lib/hooks'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { ActionSuggestions } from '@/components/dashboard/InsightCards'
import { HealthScore } from '@/components/dashboard/HealthScore'
import { AreaChart } from '@/components/charts/AreaChart'
import { DonutChart } from '@/components/charts/DonutChart'
import { BarChart } from '@/components/charts/BarChart'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CardSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

interface WidgetDef {
  id: string
  title: string
  icon: typeof Activity
  span: string
  render: (dataset: Dataset) => ReactNode
}

const widgetDefs: Record<string, WidgetDef> = {
  health: {
    id: 'health',
    title: 'AI Business Health Score',
    icon: HeartPulse,
    span: 'lg:col-span-2',
    render: (d) => <HealthScore dataset={d} />,
  },
  sentiment: {
    id: 'sentiment',
    title: 'Sentiment Analysis',
    icon: PieChart,
    span: '',
    render: (d) => (
      <div className="grid h-full place-items-center py-2">
        <DonutChart
          data={[
            { name: 'Positive', value: d.sentimentSplit[0].value, color: 'var(--color-mint-400)' },
            { name: 'Neutral', value: d.sentimentSplit[1].value, color: 'var(--color-amber-glow)' },
            { name: 'Negative', value: d.sentimentSplit[2].value, color: 'var(--color-rose-glow)' },
          ]}
        />
      </div>
    ),
  },
  trend: {
    id: 'trend',
    title: 'Review Growth',
    icon: LineChart,
    span: 'lg:col-span-2',
    render: (d) => (
      <>
        <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-mist-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-pulse-400" /> Reviews received
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-glow" /> Replies sent
          </span>
          <Badge tone="positive" className="ml-auto">
            <ArrowUpRight size={11} /> +12% MoM
          </Badge>
        </div>
        <AreaChart
          labels={d.trendSeries.labels}
          series={[
            { name: 'Reviews', color: 'var(--color-pulse-400)', values: d.trendSeries.reviews },
            { name: 'Replies', color: 'var(--color-cyan-glow)', values: d.trendSeries.responses },
          ]}
        />
      </>
    ),
  },
  topics: {
    id: 'topics',
    title: 'Top Complaint Topics',
    icon: BarChartHorizontal,
    span: '',
    render: (d) => (
      <>
        <BarChart data={d.topComplaints} color="var(--color-rose-glow)" />
        <p className="mt-3 text-[11px] leading-relaxed text-mist-500">
          Extracted by AI from your negative and critical reviews over the last 30 days.
        </p>
      </>
    ),
  },
  actions: {
    id: 'actions',
    title: 'AI Action Suggestions',
    icon: Sparkles,
    span: 'lg:col-span-2',
    render: (d) => <ActionSuggestions dataset={d} />,
  },
  activity: {
    id: 'activity',
    title: 'Live Activity',
    icon: Activity,
    span: '',
    render: (d) => <ActivityFeed key={d.type} />,
  },
}

/** Draggable dashboard widget. Drop over a sibling to swap positions. */
function Widget({
  def,
  dataset,
  onSwap,
  live,
}: {
  def: WidgetDef
  dataset: Dataset
  onSwap: (from: string, to: string) => void
  live?: string
}) {
  const [dragging, setDragging] = useState(false)
  const controls = useDragControls()
  const Icon = def.icon

  const handleDragEnd = (e: PointerEvent | MouseEvent | TouchEvent) => {
    setDragging(false)
    const point = 'changedTouches' in e ? e.changedTouches[0] : (e as PointerEvent)
    const under = document
      .elementsFromPoint(point.clientX, point.clientY)
      .map((el) => (el.closest('[data-widget-id]') as HTMLElement | null)?.dataset.widgetId)
      .find((id) => id && id !== def.id)
    if (under) onSwap(def.id, under)
  }

  return (
    <motion.section
      layout
      data-widget-id={def.id}
      drag
      dragSnapToOrigin
      dragElastic={0.12}
      dragListener={false}
      dragControls={controls}
      onDragEnd={handleDragEnd}
      transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 } }}
      className={cn(
        'glass relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl p-5 shadow-panel',
        'transition-[border-color] duration-300 hover:border-white/16',
        dragging && 'z-30 cursor-grabbing border-pulse-400/50 shadow-glow',
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-edge bg-white/4 text-pulse-300">
          <Icon size={15} />
        </span>
        <h3 className="font-display flex-1 text-sm font-semibold text-mist-50">{def.title}</h3>
        {live && (
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-mint-400">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-400" />
            {live}
          </span>
        )}
        <button
          onPointerDown={(e: ReactPointerEvent) => {
            controls.start(e)
            setDragging(true)
          }}
          onPointerUp={() => setDragging(false)}
          className="cursor-grab touch-none rounded-md p-1 text-mist-500 transition-colors hover:bg-white/8 hover:text-mist-200 active:cursor-grabbing"
          aria-label={`Drag to move ${def.title}`}
        >
          <GripVertical size={15} />
        </button>
      </div>
      <div className="min-h-0 flex-1">{def.render(dataset)}</div>
    </motion.section>
  )
}

export function Dashboard() {
  const order = useWorkspace((s) => s.widgetOrder)
  const setOrder = useWorkspace((s) => s.setWidgetOrder)
  const pushToast = useToasts((s) => s.push)
  const dataset = useDataset()
  const businessName = useBusiness((s) => s.name)
  const profile = businessProfile(dataset.type)
  const [loading, setLoading] = useState(true)
  const [liveKpis, setLiveKpis] = useState(() => dataset.kpis.map((k) => k.value))
  const [kpiType, setKpiType] = useState(dataset.type)

  // reset the live numbers when the business type changes (adjust-state-during-render pattern)
  if (kpiType !== dataset.type) {
    setKpiType(dataset.type)
    setLiveKpis(dataset.kpis.map((k) => k.value))
  }

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(t)
  }, [])

  // simulated realtime KPI drift
  useInterval(() => {
    setLiveKpis((prev) =>
      prev.map((v, i) => {
        const k = dataset.kpis[i]
        if (k.decimals || k.suffix === '%') return v
        return v + Math.floor(Math.random() * 3)
      }),
    )
  }, 8000)

  const swap = (from: string, to: string) => {
    const next = [...order]
    const a = next.indexOf(from)
    const b = next.indexOf(to)
    if (a === -1 || b === -1) return
    ;[next[a], next[b]] = [next[b], next[a]]
    setOrder(next)
  }

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  const openCount = dataset.reviews.filter((r) => r.status === 'open').length

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-2/3 max-w-md" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CardSkeleton />
          </div>
          <CardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <div className="text-xs font-medium tracking-widest text-mist-500 uppercase">
            {today} · {profile.emoji} {businessName}
          </div>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Your reputation, <span className="text-gradient">understood</span>
          </h1>
          <p className="mt-1 text-sm text-mist-400">
            Health score {dataset.health.score} ({dataset.health.grade}) · {openCount} reviews awaiting a
            reply.
          </p>
        </div>
        <Button
          variant="glass"
          size="md"
          onClick={() => {
            exportAnalyticsCsv(dataset)
            pushToast({ tone: 'success', title: 'Export ready', body: 'reviewdot-analytics.csv downloaded.' })
          }}
        >
          <Download size={15} /> Export report
        </Button>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dataset.kpis.map((k, i) => (
          <KpiCard key={k.id} kpi={k} index={i} live={liveKpis[i]} />
        ))}
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } } }}
        className="grid gap-4 lg:grid-cols-3"
      >
        {order.map((id) => {
          const def = widgetDefs[id]
          if (!def) return null
          return (
            <motion.div
              key={id}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={cn('grid', def.span)}
            >
              <Widget
                def={def}
                dataset={dataset}
                onSwap={swap}
                live={id === 'activity' ? 'LIVE' : undefined}
              />
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
