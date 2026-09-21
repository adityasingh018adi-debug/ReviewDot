import { motion } from 'framer-motion'
import { Star, TrendingUp } from 'lucide-react'
import { TableCard } from '@/components/qr/TableCard'

/**
 * A café table with a ReviewDot QR stand on it. Drawn rather than photographed
 * so it stays crisp in both themes and carries the brand palette.
 */
export function HeroVisual({ code }: { code: string }) {
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-[32px] border border-line bg-gradient-to-b from-raised to-surface px-4 pb-8 pt-20 shadow-card sm:px-10 sm:pb-10 sm:pt-24">
        {/* table surface */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-brand-50 to-transparent dark:from-brand-950/30" />
        <div className="absolute inset-x-6 bottom-10 h-px bg-line" />

        <div className="relative flex items-end justify-center gap-5">
          {/* coffee cup */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="hidden shrink-0 sm:block"
            aria-hidden
          >
            <svg width="92" height="104" viewBox="0 0 92 104" fill="none">
              <ellipse cx="44" cy="92" rx="34" ry="7" fill="var(--color-line)" opacity="0.6" />
              <path
                d="M14 40h60v28a22 22 0 0 1-22 22H36a22 22 0 0 1-22-22V40Z"
                fill="var(--color-surface)"
                stroke="var(--color-line-strong)"
                strokeWidth="2"
              />
              <path
                d="M74 48h6a10 10 0 0 1 0 20h-6"
                stroke="var(--color-line-strong)"
                strokeWidth="2"
                fill="none"
              />
              <path d="M18 44h52v10a26 26 0 0 1-52 0V44Z" fill="var(--color-brand-100)" />
              <path
                d="M30 26c0-6 6-6 6-12M46 26c0-6 6-6 6-12M62 26c0-6 6-6 6-12"
                stroke="var(--color-brand-300)"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.7"
              />
            </svg>
          </motion.div>

          {/* the QR stand */}
          <motion.div
            initial={{ opacity: 0, y: 28, rotate: -3 }}
            animate={{ opacity: 1, y: 0, rotate: -1.5 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10"
          >
            <TableCard code={code} className="w-[224px] sm:w-[256px]" />
            <div className="mx-auto mt-[-6px] h-3 w-28 rounded-b-2xl border border-t-0 border-line bg-raised" />
            <div className="mx-auto h-2 w-40 rounded-full bg-line/70 blur-[2px]" />
          </motion.div>

          {/* dessert plate */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="hidden shrink-0 sm:block"
            aria-hidden
          >
            <svg width="110" height="104" viewBox="0 0 110 104" fill="none">
              <ellipse cx="55" cy="86" rx="44" ry="11" fill="var(--color-raised)" stroke="var(--color-line)" strokeWidth="2" />
              <ellipse cx="55" cy="84" rx="30" ry="7" fill="var(--color-surface)" />
              <path d="M38 80 52 48h20l6 32H38Z" fill="var(--color-brand-100)" stroke="var(--color-brand-300)" strokeWidth="2" strokeLinejoin="round" />
              <path d="M40 66h36" stroke="var(--color-brand-300)" strokeWidth="2" />
              <circle cx="62" cy="44" r="6" fill="var(--color-star)" opacity="0.85" />
            </svg>
          </motion.div>
        </div>

        {/* live activity chips */}
        <motion.div
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="absolute left-3 top-5 z-20 flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-3.5 py-2.5 shadow-card sm:left-6"
        >
          <span className="grid size-7 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Star size={14} className="fill-current" />
          </span>
          <span className="text-left">
            <span className="block text-[12px] font-semibold leading-tight text-ink">New 5★ review</span>
            <span className="block text-[11px] leading-tight text-muted">Mango Cheesecake · Table 12</span>
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="absolute bottom-5 right-3 z-20 flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-3.5 py-2.5 shadow-card sm:right-6"
        >
          <span className="grid size-7 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <TrendingUp size={14} />
          </span>
          <span className="text-left">
            <span className="block text-[12px] font-semibold leading-tight text-ink">26.1% conversion</span>
            <span className="block text-[11px] leading-tight text-muted">scan → review, last 30 days</span>
          </span>
        </motion.div>
      </div>
    </div>
  )
}
